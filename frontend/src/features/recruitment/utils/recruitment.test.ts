/**
 * Unit tests for the pure recruitment helpers in ./recruitment.
 *
 * Covers search/filter, pipeline stage transitions and the multi-step approval
 * workflow engine. Local `makeJob` / `makeCandidate` factories build valid
 * fixtures so individual tests only override the fields under test.
 */
import { describe, it, expect } from "vitest";
import {
  searchJobs,
  filterJobs,
  searchCandidates,
  filterCandidates,
  groupCandidatesByStage,
  getNextStage,
  getPrevStage,
  canMoveToStage,
  deriveStatusForStage,
  buildApprovalWorkflow,
  applyApprovalDecision,
  isCurrentApprover,
  jobStatusAfterApproval,
} from "./recruitment";
import type { Job, Candidate } from "@hrms/middleware";

/* ----------------------------- fixtures ----------------------------- */

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job_1",
    tenantId: "t1",
    title: "Senior Engineer",
    departmentId: "dept_eng",
    location: "Remote",
    workMode: "remote",
    employmentType: "full_time",
    description: "Build great things",
    responsibilities: "Code",
    requirements: "5 years React",
    currency: "USD",
    openings: 1,
    status: "open",
    isPublished: true,
    pipelineStages: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
    approval: { required: false, steps: [], currentStep: 0, status: "approved" },
    createdBy: "u1",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand_1",
    tenantId: "t1",
    jobId: "job_1",
    jobTitle: "Senior Engineer",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    source: "careers",
    stage: "Applied",
    status: "active",
    appliedAt: 1000,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

/* ----------------------------- search/filter ----------------------------- */

describe("searchJobs", () => {
  const jobs = [
    makeJob({ id: "a", title: "Backend Engineer", location: "Berlin" }),
    makeJob({ id: "b", title: "Product Designer", location: "Remote" }),
  ];
  it("matches by title case-insensitively", () => {
    expect(searchJobs(jobs, "backend").map((j) => j.id)).toEqual(["a"]);
  });
  it("matches by location", () => {
    expect(searchJobs(jobs, "remote").map((j) => j.id)).toEqual(["b"]);
  });
  it("returns all on empty query", () => {
    expect(searchJobs(jobs, "  ")).toHaveLength(2);
  });
});

describe("filterJobs", () => {
  const jobs = [
    makeJob({ id: "a", status: "open", departmentId: "d1", employmentType: "full_time" }),
    makeJob({ id: "b", status: "draft", departmentId: "d2", employmentType: "contract" }),
    makeJob({ id: "c", status: "open", departmentId: "d2", employmentType: "full_time" }),
  ];
  it("filters by status", () => {
    expect(filterJobs(jobs, { status: "open" }).map((j) => j.id)).toEqual(["a", "c"]);
  });
  it("filters by department", () => {
    expect(filterJobs(jobs, { departmentId: "d2" }).map((j) => j.id)).toEqual(["b", "c"]);
  });
  it("combines facets", () => {
    expect(filterJobs(jobs, { status: "open", departmentId: "d2" }).map((j) => j.id)).toEqual(["c"]);
  });
  it("treats 'all' as no filter", () => {
    expect(filterJobs(jobs, { status: "all", departmentId: "all" })).toHaveLength(3);
  });
});

describe("searchCandidates / filterCandidates", () => {
  const cands = [
    makeCandidate({ id: "1", firstName: "Ada", lastName: "Lovelace", stage: "Applied", status: "active", rating: 4 }),
    makeCandidate({ id: "2", firstName: "Alan", lastName: "Turing", email: "alan@x.com", stage: "Interview", status: "active", rating: 5 }),
    makeCandidate({ id: "3", firstName: "Grace", lastName: "Hopper", stage: "Hired", status: "hired", rating: 2 }),
  ];
  it("searches by full name", () => {
    expect(searchCandidates(cands, "turing").map((c) => c.id)).toEqual(["2"]);
  });
  it("filters by stage", () => {
    expect(filterCandidates(cands, { stage: "Interview" }).map((c) => c.id)).toEqual(["2"]);
  });
  it("filters by status", () => {
    expect(filterCandidates(cands, { status: "hired" }).map((c) => c.id)).toEqual(["3"]);
  });
  it("filters by minimum rating", () => {
    expect(filterCandidates(cands, { minRating: 4 }).map((c) => c.id)).toEqual(["1", "2"]);
  });
});

describe("groupCandidatesByStage", () => {
  it("buckets candidates by stage and includes empty stages", () => {
    const cands = [
      makeCandidate({ id: "1", stage: "Applied" }),
      makeCandidate({ id: "2", stage: "Applied" }),
      makeCandidate({ id: "3", stage: "Interview" }),
    ];
    const grouped = groupCandidatesByStage(cands, STAGES);
    expect(grouped.Applied).toHaveLength(2);
    expect(grouped.Interview).toHaveLength(1);
    expect(grouped.Offer).toEqual([]);
  });
});

/* ----------------------------- stage transitions ----------------------------- */

describe("stage transition helpers", () => {
  it("getNextStage returns the following stage", () => {
    expect(getNextStage(STAGES, "Applied")).toBe("Screening");
  });
  it("getNextStage returns null at the end", () => {
    expect(getNextStage(STAGES, "Rejected")).toBeNull();
  });
  it("getNextStage returns null for unknown stage", () => {
    expect(getNextStage(STAGES, "Nope")).toBeNull();
  });
  it("getPrevStage returns the preceding stage", () => {
    expect(getPrevStage(STAGES, "Interview")).toBe("Screening");
  });
  it("getPrevStage returns null at the start", () => {
    expect(getPrevStage(STAGES, "Applied")).toBeNull();
  });
  it("canMoveToStage rejects same stage and unknown targets", () => {
    expect(canMoveToStage(STAGES, "Applied", "Applied")).toBe(false);
    expect(canMoveToStage(STAGES, "Applied", "Mars")).toBe(false);
    expect(canMoveToStage(STAGES, "Applied", "Offer")).toBe(true);
  });
  it("deriveStatusForStage flips terminal stages", () => {
    expect(deriveStatusForStage("Hired")).toBe("hired");
    expect(deriveStatusForStage("Rejected")).toBe("rejected");
    expect(deriveStatusForStage("Interview")).toBe("active");
  });
});

/* ----------------------------- approval workflow ----------------------------- */

describe("buildApprovalWorkflow", () => {
  it("creates a pending workflow from approvers", () => {
    const wf = buildApprovalWorkflow([
      { approverId: "u1", approverEmail: "u1@x.com" },
      { approverId: "u2", approverEmail: "u2@x.com", approverName: "Two" },
    ]);
    expect(wf.required).toBe(true);
    expect(wf.steps).toHaveLength(2);
    expect(wf.currentStep).toBe(0);
    expect(wf.status).toBe("pending");
    expect(wf.steps[0]!.order).toBe(0);
  });
  it("is auto-approved with no approvers", () => {
    const wf = buildApprovalWorkflow([]);
    expect(wf.required).toBe(false);
    expect(wf.status).toBe("approved");
  });
});

describe("applyApprovalDecision", () => {
  const base = buildApprovalWorkflow([
    { approverId: "u1", approverEmail: "u1@x.com" },
    { approverId: "u2", approverEmail: "u2@x.com" },
  ]);

  it("advances to the next step on approval", () => {
    const next = applyApprovalDecision(base, "approved", "u1", undefined, 5000);
    expect(next.currentStep).toBe(1);
    expect(next.status).toBe("pending");
    expect(next.steps[0]!.status).toBe("approved");
    expect(next.steps[0]!.decidedAt).toBe(5000);
  });

  it("approving the final step approves the workflow", () => {
    const afterFirst = applyApprovalDecision(base, "approved", "u1");
    const afterSecond = applyApprovalDecision(afterFirst, "approved", "u2");
    expect(afterSecond.status).toBe("approved");
  });

  it("rejection immediately rejects the workflow", () => {
    const next = applyApprovalDecision(base, "rejected", "u1", "not now");
    expect(next.status).toBe("rejected");
    expect(next.steps[0]!.comment).toBe("not now");
  });

  it("ignores decisions from the wrong approver", () => {
    const next = applyApprovalDecision(base, "approved", "intruder");
    expect(next).toBe(base); // unchanged
  });

  it("does not mutate the input workflow", () => {
    const snapshot = JSON.stringify(base);
    applyApprovalDecision(base, "approved", "u1");
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

describe("isCurrentApprover", () => {
  const wf = buildApprovalWorkflow([
    { approverId: "u1", approverEmail: "u1@x.com" },
    { approverId: "u2", approverEmail: "u2@x.com" },
  ]);
  it("is true for the current step's approver", () => {
    expect(isCurrentApprover(wf, "u1")).toBe(true);
  });
  it("is false for a later approver", () => {
    expect(isCurrentApprover(wf, "u2")).toBe(false);
  });
  it("is false once resolved", () => {
    const approved = applyApprovalDecision(applyApprovalDecision(wf, "approved", "u1"), "approved", "u2");
    expect(isCurrentApprover(approved, "u2")).toBe(false);
  });
});

describe("jobStatusAfterApproval", () => {
  it("maps workflow status to job status", () => {
    expect(jobStatusAfterApproval("approved")).toBe("approved");
    expect(jobStatusAfterApproval("rejected")).toBe("rejected");
    expect(jobStatusAfterApproval("pending")).toBe("pending_approval");
  });
});
