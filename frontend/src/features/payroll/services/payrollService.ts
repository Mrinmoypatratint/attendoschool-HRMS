import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { PayrollRun, Payslip, Employee, EmployeeCompensation } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { EmployeeService } from "../../employees/services/employeeService";

export const PayrollService = {
  /**
   * Fetches all payroll runs for the tenant.
   */
  async getPayrollRuns(tenantId: string, year?: number): Promise<PayrollRun[]> {
    let q = query(
      collection(db, "payrollRuns"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list: PayrollRun[] = [];
    snap.forEach((d) => {
      const run = d.data() as PayrollRun;
      if (!year || run.year === year) {
        list.push(run);
      }
    });
    return list;
  },

  /**
   * Fetches all itemized payslips generated for a specific payroll run.
   */
  async getPayslipsByRun(tenantId: string, payrollRunId: string): Promise<Payslip[]> {
    const q = query(
      collection(db, "payslips"),
      where("tenantId", "==", tenantId),
      where("payrollRunId", "==", payrollRunId)
    );
    const snap = await getDocs(q);
    const list: Payslip[] = [];
    snap.forEach((d) => list.push(d.data() as Payslip));
    return list.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  },

  /**
   * Fetches payslips for a specific employee (for Employee Self-Service).
   */
  async getPayslipsByEmployee(tenantId: string, employeeId: string): Promise<Payslip[]> {
    const q = query(
      collection(db, "payslips"),
      where("tenantId", "==", tenantId),
      where("employeeId", "==", employeeId),
      orderBy("year", "desc")
    );
    const snap = await getDocs(q);
    const list: Payslip[] = [];
    snap.forEach((d) => list.push(d.data() as Payslip));
    return list;
  },

  /**
   * Generates a monthly institutional payroll run for teaching and non-teaching staff.
   */
  async createPayrollRun(
    tenantId: string,
    params: {
      name: string;
      month: number;
      year: number;
      campusId?: string | undefined;
    },
    callerInfo?: { uid: string; email: string; name?: string | undefined }
  ): Promise<PayrollRun> {
    const runId = `pr_${params.year}_${params.month}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    // 1. Fetch active employees
    const allEmployees = await EmployeeService.getEmployees(tenantId);
    const eligibleEmployees = allEmployees.filter((e) => {
      if (e.status === "terminated") return false;
      if (params.campusId && e.campusId && e.campusId !== params.campusId) return false;
      return true;
    });

    if (eligibleEmployees.length === 0) {
      throw new Error("No active staff found for this payroll criteria.");
    }

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const batch = writeBatch(db);
    const payslips: Payslip[] = [];

    // 2. Compute salary structure for each employee
    for (const emp of eligibleEmployees) {
      // Attempt to load employee compensation
      let monthlyBase = 45000;
      try {
        const comp = await EmployeeService.getCompensation(emp.id);
        if (comp?.salary) {
          monthlyBase = Math.round(comp.salary / 12);
        }
      } catch {
        // Fall back to default role/grade estimation in INR
        monthlyBase = emp.teachingStatus === "teaching" ? 55000 : 38000;
      }

      // Institutional Salary Breakdown Formulas (in INR):
      // Basic = 50% of monthly base
      const basic = Math.round(monthlyBase * 0.5);
      // Dearness Allowance (DA) = 20% of Basic
      const da = Math.round(basic * 0.2);
      // House Rent Allowance (HRA) = 25% of Basic
      const hra = Math.round(basic * 0.25);
      // Transport Allowance (TA) - standard INR 2,000
      const ta = 2000;
      // Special / Academic Allowance = Remaining balance
      const special = Math.max(0, monthlyBase - (basic + da + hra + ta));

      const gross = basic + da + hra + ta + special;

      // Statutory Deductions (India):
      // Provident Fund (PF) = 12% of Basic
      const pf = Math.round(basic * 0.12);
      // ESI = 0.75% of Gross
      const esi = Math.round(gross * 0.0075);
      // Professional Tax (standard INR 200/month)
      const pt = 200;
      // Tax Deducted at Source (TDS approx 5%)
      const tds = Math.round(gross * 0.05);

      const deductionsTotal = pf + esi + pt + tds;
      const net = gross - deductionsTotal;

      totalGross += gross;
      totalDeductions += deductionsTotal;
      totalNet += net;

      const slipId = `slip_${runId}_${emp.id}`;
      const payslip: Payslip = {
        id: slipId,
        tenantId,
        payrollRunId: runId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        month: params.month,
        year: params.year,
        currency: "INR",
        basicSalary: basic,
        allowances: {
          da,
          hra,
          ta,
          special,
          other: 0,
        },
        grossEarnings: gross,
        deductions: {
          pf,
          esi,
          professionalTax: pt,
          tds,
          unpaidLeave: 0,
          other: 0,
        },
        totalDeductions: deductionsTotal,
        netSalary: net,
        paymentStatus: "unpaid",
        createdAt: now,
      };

      batch.set(doc(db, "payslips", slipId), payslip);
      payslips.push(payslip);
    }

    // 3. Create PayrollRun header
    const run: PayrollRun = {
      id: runId,
      tenantId,
      campusId: params.campusId || undefined,
      name: params.name,
      month: params.month,
      year: params.year,
      currency: "INR",
      status: "review",
      totalGross,
      totalDeductions,
      totalNet,
      employeeCount: eligibleEmployees.length,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(doc(db, "payrollRuns", runId), run);
    await batch.commit();

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "payroll",
        resourceId: runId,
        details: `Generated payroll run: ${params.name} (${eligibleEmployees.length} staff, Net: ₹${totalNet.toLocaleString('en-IN')})`,
      });
    }

    return run;
  },

  /**
   * Updates payroll run status (review -> approved -> paid).
   */
  async updatePayrollRunStatus(
    tenantId: string,
    runId: string,
    status: PayrollRun["status"],
    callerInfo?: { uid: string; email: string; name?: string | undefined }
  ): Promise<void> {
    const ref = doc(db, "payrollRuns", runId);
    const now = Date.now();

    const patch: Partial<PayrollRun> = {
      status,
      updatedAt: now,
    };

    if (status === "approved" || status === "paid") {
      patch.approvedBy = callerInfo?.name || callerInfo?.email || "HR Officer";
      patch.approvedAt = now;
    }

    await updateDoc(ref, patch);

    // If marked paid, update all payslips under this run to "paid"
    if (status === "paid") {
      const slips = await this.getPayslipsByRun(tenantId, runId);
      const batch = writeBatch(db);
      const paidDateStr = new Date().toISOString().slice(0, 10);
      slips.forEach((s) => {
        batch.update(doc(db, "payslips", s.id), {
          paymentStatus: "paid",
          paidOn: paidDateStr,
        });
      });
      await batch.commit();
    }

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "payroll",
        resourceId: runId,
        details: `Updated payroll run ${runId} status to: ${status}`,
      });
    }
  },
};
