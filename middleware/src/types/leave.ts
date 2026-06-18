/**
 * Leave management type definitions.
 *
 * Models leave types, accrual policies, leave requests (with multi-level
 * approval), per-employee balances, and holiday calendars. Consumed via named
 * imports and re-exported by the middleware barrel.
 */

import type { ApprovalWorkflow } from "./job";

/* ------------------------------------------------------------------ */
/*  Leave types                                                        */
/* ------------------------------------------------------------------ */

/** A category of leave (e.g. Annual, Sick) configurable per tenant. */
export interface LeaveType {
  id: string;
  tenantId: string;
  name: string; // e.g. "Annual Leave"
  code: string; // e.g. "AL"
  colorHex: string; // for UI chips/calendar
  paid: boolean;
  requiresApproval: boolean;
  /** Default annual allowance in days (used to seed balances). */
  defaultAllowanceDays: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave policies (accrual configuration)                             */
/* ------------------------------------------------------------------ */

/** How leave accrues over time for a policy. */
export type AccrualMethod = "annual_lump" | "monthly" | "per_pay_period" | "none";

/** Accrual configuration governing how a leave type's balance is earned/capped. */
export interface LeavePolicy {
  id: string;
  tenantId: string;
  name: string;
  leaveTypeId: string;
  accrualMethod: AccrualMethod;
  /** Days granted per accrual period (e.g. per month). For annual_lump, the yearly total. */
  accrualRateDays: number;
  /** Maximum days that can be accrued in a year (0 = uncapped). */
  annualCapDays: number;
  /** Maximum days carried over into the next year (0 = none). */
  carryOverCapDays: number;
  /** Whether balances may go negative (e.g. advance leave). */
  allowNegativeBalance: boolean;
  /** Days a new joiner must wait before leave accrues/can be taken. */
  waitingPeriodDays: number;
  effectiveFrom: string; // ISO date
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave requests (multi-level approval)                              */
/* ------------------------------------------------------------------ */

/** Lifecycle state of a leave request. */
export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

/** An employee's request for leave, carrying a multi-level approval workflow. */
export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  /** Number of working days requested (excludes weekends/holidays). */
  days: number;
  halfDay: boolean;
  reason: string;
  status: LeaveRequestStatus;
  /** Multi-level sequential approval workflow. */
  approval: ApprovalWorkflow;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave balances                                                     */
/* ------------------------------------------------------------------ */

/** An employee's accrued/used/pending balance for one leave type and year. */
export interface LeaveBalance {
  id: string; // `${tenantId}_${employeeId}_${leaveTypeId}_${year}`
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  accruedDays: number;
  usedDays: number;
  /** Days reserved by pending (not yet approved) requests. */
  pendingDays: number;
  carriedOverDays: number;
  /** Epoch ms of the last accrual run applied to this balance. */
  lastAccruedAt: number;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Holiday calendars                                                  */
/* ------------------------------------------------------------------ */

/** A single public/company holiday entry. */
export interface Holiday {
  date: string; // ISO date (YYYY-MM-DD)
  name: string;
}

/** A named, year-scoped set of holidays used in working-day calculations. */
export interface HolidayCalendar {
  id: string;
  tenantId: string;
  name: string;
  year: number;
  holidays: Holiday[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}
