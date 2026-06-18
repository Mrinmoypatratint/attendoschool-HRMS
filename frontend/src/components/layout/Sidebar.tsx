/**
 * Sidebar
 * -------
 * Primary left-hand navigation for the authenticated app shell. Renders the
 * tenant branding, a permission-filtered list of navigation destinations, and a
 * user/footer section with sign-out. Supports a collapsed (icon-only) mode and
 * reflects the active tenant's primary brand color.
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Shield, Settings, ChevronLeft, ChevronRight, LogOut, Briefcase, Network, KanbanSquare, FileText, CalendarDays, FolderLock } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  // The granular permission required to see this item. Items without a
  // permission are always visible (Dashboard, Org Settings). Each value mirrors
  // the corresponding route guard in App.tsx so the menu only surfaces
  // destinations the current role can actually open.
  permission?: PermissionKey;
}

/**
 * Renders the application's primary navigation sidebar.
 *
 * Builds the full menu, filters it down to destinations the current role is
 * permitted to access, and displays tenant/user branding. Includes a
 * collapse/expand toggle and a logout action.
 *
 * @returns The sidebar navigation element.
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTenant, profile, logout } = useAuth();
  const hasPermission = useHasPermission();

  const allMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employees", href: "/employees", icon: Briefcase, permission: "employees.view" },
    { label: "Teams", href: "/teams", icon: Network, permission: "teams.view" },
    { label: "Job Requisitions", href: "/jobs", icon: FileText, permission: "jobs.view" },
    { label: "Pipeline", href: "/pipeline", icon: KanbanSquare, permission: "candidates.view" },
    { label: "Leave", href: "/leave", icon: CalendarDays, permission: "leave.view" },
    { label: "Document Vault", href: "/documents", icon: FolderLock, permission: "documents.view" },
    { label: "Users & Invites", href: "/users", icon: Users, permission: "users.view" },
    { label: "RBAC Roles", href: "/rbac", icon: Shield, permission: "roles.view" },
    { label: "Org Settings", href: "/settings", icon: Settings },
  ];

  // Hide any destination the current role lacks permission for. Items without a
  // declared permission stay visible to every authenticated member.
  const menuItems = allMenuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );


  // Derive up-to-two-letter initials from a display name for the avatar fallback.
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Active tenant brand color, falling back to the default blue when unset.
  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Top Header Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            {activeTenant?.logoURL ? (
              <img
                src={activeTenant.logoURL}
                alt={activeTenant.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {activeTenant ? getInitials(activeTenant.name) : "HR"}
              </div>
            )}
            <div className="truncate max-w-[140px]">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {activeTenant?.name || "Acme Org"}
              </h1>
              <p 
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: primaryColor }}
              >
                {profile?.tenants?.[profile.activeTenantId || ""]?.role.replace("_", " ") || "Member"}
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {activeTenant ? getInitials(activeTenant.name) : "HR"}
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-900 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4" aria-label="Navigation">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? ""
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}
                }
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info & Signout */}
      <div className="border-t border-slate-100 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
              {profile ? getInitials(profile.displayName) : "U"}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">{profile?.displayName}</h2>
              <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
