import type { Department } from "@hrms/middleware";

export interface DepartmentNode {
  department: Department;
  children: DepartmentNode[];
  level: number;
}

/**
 * Checks if setting a department's parent to proposedParentId would create a circular dependency.
 * A circular dependency exists if proposedParentId is the department itself, or any of its descendants.
 */
export function hasCircularDependency(
  departments: Department[],
  deptId: string,
  proposedParentId: string | undefined
): boolean {
  if (!proposedParentId) return false;
  if (deptId === proposedParentId) return true;

  // Build an adjacency map (deptId -> parentId)
  const parentMap = new Map<string, string>();
  departments.forEach((d) => {
    if (d.parentId) {
      parentMap.set(d.id, d.parentId);
    }
  });

  // Temporarily set the proposed relationship to model the future state
  parentMap.set(deptId, proposedParentId);

  // Traverse upwards from proposedParentId to see if we ever reach deptId
  let current: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (current) {
    if (current === deptId) return true;
    if (visited.has(current)) {
      // Loop detected
      return true;
    }
    visited.add(current);
    current = parentMap.get(current);
  }

  return false;
}

/**
 * Builds a nested tree of departments.
 */
export function buildDepartmentTree(
  departments: Department[],
  parentId: string | undefined = undefined,
  level: number = 0
): DepartmentNode[] {
  return departments
    .filter((d) => {
      if (parentId === undefined) {
        return !d.parentId;
      }
      return d.parentId === parentId;
    })
    .map((d) => ({
      department: d,
      children: buildDepartmentTree(departments, d.id, level + 1),
      level,
    }));
}
