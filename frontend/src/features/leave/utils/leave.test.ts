/**
 * Unit tests for the pure leave utilities in ./leave: working-day counting,
 * the accrual engine (periodsElapsed/computeAccrual), balance math
 * (availableBalance/canBook/computeCarryOver), and the multi-level approval
 * workflow helpers. All functions under test are deterministic and UTC-based.
 */
import { describe, it, expect } from "vitest";
import {
  isoToMs,
  isWeekend,
  workingDaysBetween,
  periodsElapsed,
  computeAccrual,
  availableBalance,
  canBook,
  computeCarryOver,
  buildApprovalWorkflow,
  applyApprovalDecision,
  isCurrentApprover,
  requestStatusFromApproval,
} from "./leave";

/* ----------------------------- working days ----------------------------- */

describe("isWeekend / workingDaysBetween", () => {
  it("identifies weekends (UTC)", () => {
    expect(isWeekend("2026-06-13")).toBe(true); // Saturday
    expect(isWeekend("2026-06-14")).toBe(true); // Sunday
    expect(isWeekend("2026-06-15")).toBe(false); // Monday
  });

  it("counts inclusive working days excluding weekends", () => {
    // Mon 2026-06-15 .. Fri 2026-06-19 = 5 working days
    expect(workingDaysBetween("2026-06-15", "2026-06-19")).toBe(5);
    // includes a weekend: Fri..next Mon = Fri, Mon = 2
    expect(workingDaysBetween("2026-06-19", "2026-06-22")).toBe(2);
  });

  it("excludes holidays", () => {
    // Mon..Fri with Wed holiday => 4
    expect(workingDaysBetween("2026-06-15", "2026-06-19", ["2026-06-17"])).toBe(4);
  });

  it("returns 0 when end before start", () => {
    expect(workingDaysBetween("2026-06-19", "2026-06-15")).toBe(0);
  });
});

/* ----------------------------- accrual engine ----------------------------- */

describe("periodsElapsed", () => {
  const jan1 = isoToMs("2026-01-01");
  it("monthly counts month boundaries", () => {
    expect(periodsElapsed("monthly", jan1, isoToMs("2026-04-01"))).toBe(3);
    expect(periodsElapsed("monthly", jan1, isoToMs("2026-01-15"))).toBe(0);
  });
  it("per_pay_period counts 14-day blocks", () => {
    expect(periodsElapsed("per_pay_period", jan1, isoToMs("2026-01-29"))).toBe(2);
  });
  it("annual_lump counts year boundaries", () => {
    expect(periodsElapsed("annual_lump", jan1, isoToMs("2028-06-01"))).toBe(2);
  });
  it("none is always 0", () => {
    expect(periodsElapsed("none", jan1, isoToMs("2030-01-01"))).toBe(0);
  });
});

describe("computeAccrual", () => {
  const monthly = { accrualMethod: "monthly" as const, accrualRateDays: 1.5, annualCapDays: 18, effectiveFrom: "2026-01-01" };

  it("accrues per elapsed month from effectiveFrom on first run", () => {
    const r = computeAccrual(monthly, 0, 0, isoToMs("2026-04-01"));
    expect(r.periods).toBe(3);
    expect(r.accruedDelta).toBe(4.5);
    expect(r.newAccruedDays).toBe(4.5);
    expect(r.newLastAccruedAt).toBe(isoToMs("2026-04-01"));
  });

  it("caps at annualCapDays", () => {
    const r = computeAccrual(monthly, 0, 0, isoToMs("2027-01-01")); // 12 months * 1.5 = 18, capped 18
    expect(r.newAccruedDays).toBe(18);
    // beyond cap, no further accrual
    const r2 = computeAccrual(monthly, isoToMs("2027-01-01"), 18, isoToMs("2027-06-01"));
    expect(r2.newAccruedDays).toBe(18);
    expect(r2.accruedDelta).toBe(0);
  });

  it("annual_lump grants full amount on first run even within the same year", () => {
    const annual = { accrualMethod: "annual_lump" as const, accrualRateDays: 20, annualCapDays: 0, effectiveFrom: "2026-01-01" };
    const r = computeAccrual(annual, 0, 0, isoToMs("2026-03-01"));
    expect(r.periods).toBe(1);
    expect(r.newAccruedDays).toBe(20);
  });

  it("none method never accrues", () => {
    const none = { accrualMethod: "none" as const, accrualRateDays: 5, annualCapDays: 0, effectiveFrom: "2026-01-01" };
    const r = computeAccrual(none, 0, 3, isoToMs("2030-01-01"));
    expect(r.accruedDelta).toBe(0);
    expect(r.newAccruedDays).toBe(3);
  });
});

/* ----------------------------- balance math ----------------------------- */

describe("balance math", () => {
  const bal = { accruedDays: 15, carriedOverDays: 5, usedDays: 4, pendingDays: 2 };
  it("availableBalance = accrued + carried - used - pending", () => {
    expect(availableBalance(bal)).toBe(14);
  });
  it("canBook respects availability and negative rule", () => {
    expect(canBook(bal, 10, false)).toBe(true);
    expect(canBook(bal, 20, false)).toBe(false);
    expect(canBook(bal, 20, true)).toBe(true);
    expect(canBook(bal, 0, true)).toBe(false);
  });
  it("computeCarryOver caps at carryOverCap", () => {
    expect(computeCarryOver(bal, 10)).toBe(10); // available 14 capped at 10
    expect(computeCarryOver(bal, 0)).toBe(0); // no carryover
    expect(computeCarryOver({ accruedDays: 3, carriedOverDays: 0, usedDays: 0, pendingDays: 0 }, 10)).toBe(3);
  });
});

/* ----------------------------- approvals ----------------------------- */

describe("multi-level approval", () => {
  const wf = buildApprovalWorkflow([
    { approverId: "mgr", approverEmail: "mgr@x.com" },
    { approverId: "hr", approverEmail: "hr@x.com" },
  ]);

  it("builds a pending 2-step workflow", () => {
    expect(wf.required).toBe(true);
    expect(wf.steps).toHaveLength(2);
    expect(wf.status).toBe("pending");
  });

  it("requires all levels to approve sequentially", () => {
    const afterMgr = applyApprovalDecision(wf, "approved", "mgr");
    expect(afterMgr.status).toBe("pending");
    expect(afterMgr.currentStep).toBe(1);
    const afterHr = applyApprovalDecision(afterMgr, "approved", "hr");
    expect(afterHr.status).toBe("approved");
  });

  it("any level rejection rejects the request", () => {
    const rejected = applyApprovalDecision(wf, "rejected", "mgr", "no");
    expect(rejected.status).toBe("rejected");
  });

  it("only the current approver can act", () => {
    expect(applyApprovalDecision(wf, "approved", "hr")).toBe(wf); // hr is level 2, not current
    expect(isCurrentApprover(wf, "mgr")).toBe(true);
    expect(isCurrentApprover(wf, "hr")).toBe(false);
  });

  it("maps workflow status to request status", () => {
    expect(requestStatusFromApproval("approved")).toBe("approved");
    expect(requestStatusFromApproval("rejected")).toBe("rejected");
    expect(requestStatusFromApproval("pending")).toBe("pending");
  });

  it("auto-approves when there are no approvers", () => {
    const none = buildApprovalWorkflow([]);
    expect(none.required).toBe(false);
    expect(none.status).toBe("approved");
  });
});
