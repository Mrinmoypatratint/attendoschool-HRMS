/**
 * Department type definitions.
 *
 * Models an organizational department, including support for a parent-child
 * hierarchy via `parentId`. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/**
 * A department within a tenant. Departments can form a tree through `parentId`
 * (cycle prevention is enforced in application logic, not the type).
 */
export interface Department {
  id: string;
  tenantId: string;
  name: string;
  code: string; // e.g. "ENG", "MKT", "HR"
  description: string;
  managerId?: string; // Employee ID of the department manager
  parentId?: string; // Parent department ID (references Department.id)
  isArchived?: boolean; // Archived status
  createdAt: number;
  updatedAt: number;
}
