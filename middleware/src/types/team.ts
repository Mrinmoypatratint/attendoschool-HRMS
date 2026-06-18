/**
 * Team type definitions.
 *
 * Models a team nested within a department, with an optional lead and a member
 * roster. Consumed via named imports and re-exported by the middleware barrel.
 */

/** A team belonging to a department, with a lead and a list of member employees. */
export interface Team {
  id: string;
  tenantId: string;
  name: string;
  departmentId: string; // References Department.id
  description: string;
  leadId?: string; // References Employee.id — the team lead
  memberIds: string[]; // Array of Employee.id values
  createdAt: number;
  updatedAt: number;
}
