import { describe, it, expect } from "vitest";
import type { Department } from "@hrms/middleware";
import { hasCircularDependency, buildDepartmentTree } from "./departments";

const mockDepartment = (id: string, parentId?: string, isArchived?: boolean): Department => {
  const dept: Department = {
    id,
    tenantId: "tenant_1",
    name: `Dept ${id}`,
    code: id.toUpperCase(),
    description: `Description for ${id}`,
    managerId: "mgr_1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (parentId !== undefined) {
    dept.parentId = parentId;
  }
  if (isArchived !== undefined) {
    dept.isArchived = isArchived;
  }
  return dept;
};

describe("Department Hierarchy Utilities", () => {
  describe("hasCircularDependency", () => {
    it("should return false if proposedParentId is undefined", () => {
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
      ];
      expect(hasCircularDependency(depts, "dept_b", undefined)).toBe(false);
    });

    it("should return true if proposedParentId is the department itself", () => {
      const depts = [mockDepartment("dept_a")];
      expect(hasCircularDependency(depts, "dept_a", "dept_a")).toBe(true);
    });

    it("should return true if proposedParentId is a direct descendant", () => {
      // Structure: A -> B
      // Proposed: set A's parent to B
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
      ];
      expect(hasCircularDependency(depts, "dept_a", "dept_b")).toBe(true);
    });

    it("should return true if proposedParentId is a nested descendant", () => {
      // Structure: A -> B -> C -> D
      // Proposed: set A's parent to D
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
        mockDepartment("dept_d", "dept_c"),
      ];
      expect(hasCircularDependency(depts, "dept_a", "dept_d")).toBe(true);
    });

    it("should return false if setting parent to an independent department", () => {
      // Structure: A -> B, C -> D
      // Proposed: set B's parent to D
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c"),
        mockDepartment("dept_d", "dept_c"),
      ];
      expect(hasCircularDependency(depts, "dept_b", "dept_d")).toBe(false);
    });
  });

  describe("buildDepartmentTree", () => {
    it("should build a nested tree structure for departments", () => {
      // Structure:
      // - A (Root)
      //   - B (Child of A)
      //     - C (Child of B)
      // - D (Root)
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
        mockDepartment("dept_d"),
      ];

      const tree = buildDepartmentTree(depts);

      expect(tree.length).toBe(2);
      
      const nodeA = tree.find(n => n.department.id === "dept_a");
      const nodeD = tree.find(n => n.department.id === "dept_d");

      expect(nodeA).toBeDefined();
      expect(nodeD).toBeDefined();

      expect(nodeA!.children.length).toBe(1);
      const childB = nodeA!.children[0]!;
      expect(childB.department.id).toBe("dept_b");
      expect(childB.level).toBe(1);

      expect(childB.children.length).toBe(1);
      const grandchildC = childB.children[0]!;
      expect(grandchildC.department.id).toBe("dept_c");
      expect(grandchildC.level).toBe(2);

      expect(nodeD!.children.length).toBe(0);
      expect(nodeD!.level).toBe(0);
    });

    it("should build subtrees starting from a specific parent ID", () => {
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
      ];

      const tree = buildDepartmentTree(depts, "dept_a");
      expect(tree.length).toBe(1);
      const firstNode = tree[0]!;
      expect(firstNode.department.id).toBe("dept_b");
      expect(firstNode.children.length).toBe(1);
      expect(firstNode.children[0]!.department.id).toBe("dept_c");
    });
  });
});
