import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { PayrollService } from "../services/payrollService";
import { CampusService } from "../../campuses/services/campusService";
import type { PayrollRun, Payslip, Campus } from "@hrms/middleware";
import { 
  IndianRupee, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Printer, 
  Check, 
  AlertCircle, 
  Users 
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PayrollPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("payroll.process");
  const canApprove = hasPerm("payroll.approve");

  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Payroll Run Modal
  const [runModalOpen, setRunModalOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>("");
  const [formMonth, setFormMonth] = useState<number>(now.getMonth() + 1);
  const [formYear, setFormYear] = useState<number>(now.getFullYear());
  const [formCampusId, setFormCampusId] = useState<string>("");
  const [processingRun, setProcessingRun] = useState<boolean>(false);

  // Selected Run & Payslip Drawer
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState<boolean>(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [runs, campList] = await Promise.all([
        PayrollService.getPayrollRuns(tenantId, selectedYear),
        CampusService.getCampuses(tenantId),
      ]);
      setPayrollRuns(runs);
      setCampuses(campList);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // View itemized payslips for a run
  const handleViewRun = async (run: PayrollRun) => {
    setSelectedRun(run);
    setLoadingPayslips(true);
    try {
      const slips = await PayrollService.getPayslipsByRun(tenantId, run.id);
      setPayslips(slips);
    } catch (err) {
      alert("Error loading payslips: " + getFriendlyErrorMessage(err));
    } finally {
      setLoadingPayslips(false);
    }
  };

  // Generate a new payroll run
  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    setProcessingRun(true);
    try {
      const runTitle = formName || `${MONTHS[formMonth - 1]} ${formYear} Staff Payroll`;
      await PayrollService.createPayrollRun(
        tenantId,
        {
          name: runTitle,
          month: formMonth,
          year: formYear,
          campusId: formCampusId ? formCampusId : undefined,
        },
        { uid: user.uid, email: user.email || "", name: profile?.displayName || undefined }
      );
      setRunModalOpen(false);
      setFormName("");
      await loadData();
      alert("Payroll run processed successfully.");
    } catch (err) {
      alert("Error processing payroll: " + getFriendlyErrorMessage(err));
    } finally {
      setProcessingRun(false);
    }
  };

  // Status transitions
  const handleUpdateStatus = async (runId: string, status: PayrollRun["status"]) => {
    if (!tenantId || !user) return;
    try {
      await PayrollService.updatePayrollRunStatus(tenantId, runId, status, {
        uid: user.uid,
        email: user.email || "",
        name: profile?.displayName || undefined,
      });
      await loadData();
      if (selectedRun && selectedRun.id === runId) {
        setSelectedRun((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      alert("Error updating payroll status: " + getFriendlyErrorMessage(err));
    }
  };

  // Overall totals
  const totalOutflow = useMemo(() => {
    return payrollRuns.reduce((acc, r) => acc + (r.totalNet || 0), 0);
  }, [payrollRuns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="text-blue-600" size={26} />
            Institutional Payroll & Compensation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage teaching and administrative salary runs, statutory deductions (PF, ESI, TDS), and itemized payslips.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setRunModalOpen(true);
              setFormName(`${MONTHS[now.getMonth()]} ${now.getFullYear()} Staff Payroll`);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            Process Monthly Payroll
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Net Disbursed ({selectedYear})</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">₹{totalOutflow.toLocaleString('en-IN')}</div>
          <div className="text-xs text-slate-400 mt-0.5">{payrollRuns.length} Payroll Cycles</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={13} /> Approved Runs
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {payrollRuns.filter((r) => r.status === "approved" || r.status === "paid").length}
          </div>
          <div className="text-xs text-emerald-600/80 mt-0.5">Ready for disbursement</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={13} /> Under Review
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {payrollRuns.filter((r) => r.status === "review" || r.status === "draft").length}
          </div>
          <div className="text-xs text-amber-600/80 mt-0.5">Awaiting authorized approval</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users size={13} /> Total Staff Covered
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {payrollRuns[0]?.employeeCount || 0}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">In most recent cycle</div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h2 className="font-bold text-slate-900 text-base">Payroll Runs</h2>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load payroll" description={error} onRetry={loadData} />
        ) : payrollRuns.length === 0 ? (
          <EmptyState
            icon={<IndianRupee className="text-slate-300" size={40} />}
            title="No payroll runs recorded"
            description="Click 'Process Monthly Payroll' to calculate salaries and generate itemized payslips."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Cycle Name</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Total Gross</th>
                  <th className="py-3 px-4">Total Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{run.name}</div>
                      <div className="text-xs text-slate-400">ID: {run.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {MONTHS[run.month - 1]} {run.year}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {run.employeeCount} Staff
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      ₹{run.totalGross.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-rose-600">
                      -₹{run.totalDeductions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm">
                      ₹{run.totalNet.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          run.status === "paid"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : run.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {run.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewRun(run)}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg transition-colors"
                        >
                          Payslips ({run.employeeCount})
                        </button>
                        {canApprove && run.status === "review" && (
                          <button
                            onClick={() => handleUpdateStatus(run.id, "approved")}
                            className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {canManage && run.status === "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(run.id, "paid")}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Run Payslips Section */}
      {selectedRun && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Payslips for {selectedRun.name}
              </h3>
              <p className="text-xs text-slate-500">
                Itemized breakdown for each faculty and non-teaching employee in this cycle.
              </p>
            </div>
            <button
              onClick={() => setSelectedRun(null)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Close Breakdown
            </button>
          </div>

          {loadingPayslips ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Basic</th>
                    <th className="py-3 px-4">DA / HRA / TA</th>
                    <th className="py-3 px-4">Gross Earnings</th>
                    <th className="py-3 px-4">PF & Deductions</th>
                    <th className="py-3 px-4">Net Salary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">View Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {slip.employeeName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        ₹{slip.basicSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        ₹{(slip.allowances.da + slip.allowances.hra + slip.allowances.ta).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                        ₹{slip.grossEarnings.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-rose-600">
                        -₹{slip.totalDeductions.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-700">
                        ₹{slip.netSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          slip.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {slip.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayslip(slip)}
                          className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Payroll Run Modal */}
      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateRun}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="text-blue-600" size={20} />
              Process Monthly Payroll
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Computes basic pay, dearness allowance, house rent, and statutory PF/ESI deductions for all eligible staff.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October 2026 Faculty & Staff Payroll"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Month</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Campus / Branch (Optional)</label>
                <select
                  value={formCampusId}
                  onChange={(e) => setFormCampusId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  <option value="">All Campuses (Entire Institution)</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRunModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processingRun}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {processingRun ? "Calculating Payroll..." : "Generate Payroll Run"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Individual Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Institutional Salary Payslip
                </h3>
                <p className="text-xs text-slate-500">
                  {MONTHS[selectedPayslip.month - 1]} {selectedPayslip.year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                  title="Print Slip"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Employee Meta */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Employee Name:</span>{" "}
                <strong className="text-slate-900">{selectedPayslip.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Employee ID:</span>{" "}
                <strong className="font-mono text-slate-800">{selectedPayslip.employeeId}</strong>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="font-semibold text-emerald-700 uppercase">
                  {selectedPayslip.paymentStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Payroll Cycle:</span>{" "}
                <span className="text-slate-700 font-mono">{selectedPayslip.payrollRunId}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-xs uppercase text-slate-700 mb-2 border-b pb-1">
                  Earnings
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Pay</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dearness Allowance (DA)</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.allowances.da.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent (HRA)</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.allowances.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transport Allowance (TA)</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.allowances.ta.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Academic / Special</span>
                    <span className="font-mono font-medium">₹{selectedPayslip.allowances.special.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-bold text-slate-900">
                    <span>Total Gross</span>
                    <span>₹{selectedPayslip.grossEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl p-3">
                <div className="font-bold text-xs uppercase text-slate-700 mb-2 border-b pb-1">
                  Deductions
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provident Fund (PF 12%)</span>
                    <span className="font-mono font-medium text-rose-600">-₹{selectedPayslip.deductions.pf.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ESI (0.75%)</span>
                    <span className="font-mono font-medium text-rose-600">-₹{selectedPayslip.deductions.esi.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Professional Tax</span>
                    <span className="font-mono font-medium text-rose-600">-₹{selectedPayslip.deductions.professionalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TDS / Income Tax</span>
                    <span className="font-mono font-medium text-rose-600">-₹{selectedPayslip.deductions.tds.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>-₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Box */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-emerald-800 uppercase">Net Take-Home Pay</div>
                <div className="text-xs text-emerald-600">Disbursed via Direct Bank Deposit</div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
