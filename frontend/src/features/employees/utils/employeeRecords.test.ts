import { describe, it, expect } from "vitest";
import {
  isoToMs,
  deriveContractStatus,
  isContractActive,
  getActiveContract,
  getPrimaryContact,
  applyPrimarySelection,
  sortHistory,
  latestTitle,
  activeAssets,
  flaggedAssetCount,
  sortLifecycle,
  deriveCurrentStage,
  isForwardTransition,
} from "./employeeRecords";
import type {
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
} from "@hrms/middleware";

const NOW = Date.parse("2026-06-16T00:00:00Z");

function contract(o: Partial<EmployeeContract> = {}): EmployeeContract {
  return {
    id: "c1", tenantId: "t1", employeeId: "e1",
    title: "Permanent Agreement", type: "full_time",
    startDate: "2025-01-01", salary: 100000, currency: "USD", status: "active",
    createdAt: 1, updatedAt: 1, ...o,
  };
}
function ec(o: Partial<EmergencyContact> = {}): EmergencyContact {
  return { id: "ec1", tenantId: "t1", employeeId: "e1", name: "Jo", relationship: "spouse", phone: "123", isPrimary: false, createdAt: 1, updatedAt: 1, ...o };
}
function hist(o: Partial<EmploymentHistoryEntry> = {}): EmploymentHistoryEntry {
  return { id: "h1", tenantId: "t1", employeeId: "e1", changeType: "hired", title: "Engineer", effectiveDate: "2025-01-01", createdAt: 1, updatedAt: 1, ...o };
}
function asset(o: Partial<EmployeeAsset> = {}): EmployeeAsset {
  return { id: "a1", tenantId: "t1", employeeId: "e1", name: "Laptop", assetType: "laptop", assignedDate: "2025-01-01", status: "assigned", createdAt: 1, updatedAt: 1, ...o };
}
function life(o: Partial<LifecycleEvent> = {}): LifecycleEvent {
  return { id: "l1", tenantId: "t1", employeeId: "e1", stage: "onboarding", effectiveDate: "2025-01-01", createdBy: "u1", createdAt: 1, ...o };
}

describe("isoToMs", () => {
  it("parses ISO dates and returns NaN for empty", () => {
    expect(isoToMs("2025-01-01")).toBe(Date.parse("2025-01-01"));
    expect(Number.isNaN(isoToMs(undefined))).toBe(true);
    expect(Number.isNaN(isoToMs(""))).toBe(true);
  });
});

describe("deriveContractStatus", () => {
  it("keeps manual draft/terminated statuses", () => {
    expect(deriveContractStatus(contract({ status: "draft" }), NOW)).toBe("draft");
    expect(deriveContractStatus(contract({ status: "terminated" }), NOW)).toBe("terminated");
  });
  it("marks expired when endDate has passed", () => {
    expect(deriveContractStatus(contract({ status: "active", endDate: "2025-12-31" }), NOW)).toBe("expired");
  });
  it("treats a future start as draft (not yet started)", () => {
    expect(deriveContractStatus(contract({ status: "active", startDate: "2099-01-01" }), NOW)).toBe("draft");
  });
  it("is active when started and not expired", () => {
    expect(deriveContractStatus(contract({ status: "active", startDate: "2025-01-01", endDate: "2099-01-01" }), NOW)).toBe("active");
  });
});

describe("isContractActive / getActiveContract", () => {
  it("isContractActive reflects derived status", () => {
    expect(isContractActive(contract({ endDate: "2099-01-01" }), NOW)).toBe(true);
    expect(isContractActive(contract({ endDate: "2024-01-01" }), NOW)).toBe(false);
  });
  it("returns the most recently started active contract", () => {
    const a = contract({ id: "a", startDate: "2025-01-01", endDate: "2099-01-01" });
    const b = contract({ id: "b", startDate: "2026-01-01", endDate: "2099-01-01" });
    const expired = contract({ id: "x", startDate: "2020-01-01", endDate: "2021-01-01" });
    expect(getActiveContract([a, expired, b], NOW)?.id).toBe("b");
  });
  it("returns null when none active", () => {
    expect(getActiveContract([contract({ status: "terminated" })], NOW)).toBeNull();
  });
});

describe("emergency contacts", () => {
  it("getPrimaryContact prefers the flagged primary", () => {
    const list = [ec({ id: "1" }), ec({ id: "2", isPrimary: true })];
    expect(getPrimaryContact(list)?.id).toBe("2");
  });
  it("getPrimaryContact falls back to first then null", () => {
    expect(getPrimaryContact([ec({ id: "1" })])?.id).toBe("1");
    expect(getPrimaryContact([])).toBeNull();
  });
  it("applyPrimarySelection flips a single primary", () => {
    const list = [ec({ id: "1", isPrimary: true }), ec({ id: "2" })];
    const next = applyPrimarySelection(list, "2");
    expect(next.find((c) => c.id === "1")!.isPrimary).toBe(false);
    expect(next.find((c) => c.id === "2")!.isPrimary).toBe(true);
    // does not mutate input
    expect(list.find((c) => c.id === "1")!.isPrimary).toBe(true);
  });
});

describe("employment history", () => {
  it("sorts newest effective first and returns latest title", () => {
    const a = hist({ id: "a", title: "Engineer", effectiveDate: "2024-01-01" });
    const b = hist({ id: "b", title: "Senior Engineer", effectiveDate: "2025-06-01" });
    const c = hist({ id: "c", title: "Lead", effectiveDate: "2026-01-01" });
    const sorted = sortHistory([a, c, b]);
    expect(sorted.map((x) => x.id)).toEqual(["c", "b", "a"]);
    expect(latestTitle([a, c, b])).toBe("Lead");
  });
  it("latestTitle is null for empty", () => {
    expect(latestTitle([])).toBeNull();
  });
});

describe("assets", () => {
  it("activeAssets returns only assigned", () => {
    const list = [asset({ id: "1" }), asset({ id: "2", status: "returned" }), asset({ id: "3", status: "lost" })];
    expect(activeAssets(list).map((a) => a.id)).toEqual(["1"]);
  });
  it("flaggedAssetCount counts lost/damaged", () => {
    const list = [asset({ status: "lost" }), asset({ status: "damaged" }), asset({ status: "assigned" })];
    expect(flaggedAssetCount(list)).toBe(2);
  });
});

describe("lifecycle", () => {
  it("sorts newest first using effectiveDate then createdAt", () => {
    const a = life({ id: "a", stage: "onboarding", effectiveDate: "2025-01-01", createdAt: 1 });
    const b = life({ id: "b", stage: "active", effectiveDate: "2025-06-01", createdAt: 2 });
    const c = life({ id: "c", stage: "active", effectiveDate: "2025-06-01", createdAt: 5 });
    const sorted = sortLifecycle([a, b, c]);
    expect(sorted[0]!.id).toBe("c"); // same date, higher createdAt first
    expect(sorted[sorted.length - 1]!.id).toBe("a");
  });
  it("deriveCurrentStage returns the latest stage", () => {
    const events = [
      life({ id: "a", stage: "onboarding", effectiveDate: "2025-01-01" }),
      life({ id: "b", stage: "active", effectiveDate: "2025-03-01" }),
    ];
    expect(deriveCurrentStage(events)).toBe("active");
    expect(deriveCurrentStage([])).toBeNull();
  });
  it("isForwardTransition respects canonical order with reversible on_leave", () => {
    expect(isForwardTransition("onboarding", "active")).toBe(true);
    expect(isForwardTransition("active", "onboarding")).toBe(false);
    expect(isForwardTransition("active", "on_leave")).toBe(true);
    expect(isForwardTransition("on_leave", "active")).toBe(true);
    expect(isForwardTransition("active", "active")).toBe(false);
    expect(isForwardTransition("offboarding", "terminated")).toBe(true);
  });
});
