/**
 * TopHeader
 * ---------
 * Sticky top bar for the authenticated app shell. Provides a global search
 * input, an organization (tenant) switcher for users belonging to multiple
 * tenants, and the notifications bell. Tenant documents are loaded lazily from
 * Firestore based on the membership map on the user's profile.
 */
import { useState, useEffect } from "react";
import { Search, ChevronDown, Building2, Briefcase } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";
import type { Tenant } from "@hrms/middleware";

/**
 * Renders the application's top header bar.
 *
 * Fetches the full tenant records for every tenant the user belongs to (to
 * populate the switcher), exposes a search field, and renders the tenant
 * switcher (only interactive when the user has more than one tenant) plus the
 * notification bell.
 *
 * @returns The header element.
 */
export function TopHeader() {
  const { profile, activeTenant, switchTenant } = useAuth();
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load the Tenant documents for each tenant the user is a member of so the
  // switcher can display their names; re-runs whenever the membership map changes.
  useEffect(() => {
    if (!profile?.tenants) {
      setTenantsList([]);
      return;
    }

    const tenantIds = Object.keys(profile.tenants);
    if (tenantIds.length === 0) {
      setTenantsList([]);
      return;
    }

    const fetchTenants = async () => {
      try {
        // Fetch all tenant docs in parallel, then keep only the ones that exist.
        const promises = tenantIds.map((id) => getDoc(doc(db, "tenants", id)));
        const snaps = await Promise.all(promises);
        const list: Tenant[] = [];
        snaps.forEach((snap) => {
          if (snap.exists()) {
            list.push(snap.data() as Tenant);
          }
        });
        setTenantsList(list);
      } catch (err) {
        console.error("Error fetching tenants for switcher:", err);
      }
    };

    fetchTenants();
  }, [profile?.tenants]);

  // Switch the active tenant and close the dropdown on success.
  const handleTenantChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Failed to switch tenant:", err);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search employees, roles, tasks..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600/60 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            aria-label="Search"
          />
        </div>

        {/* Action Items */}
        <div className="flex items-center gap-4">
          {activeTenant && (
            <a
              href={`/careers/${encodeURIComponent(activeTenant.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
            >
              <Briefcase size={16} className="text-blue-600" />
              <span className="hidden sm:inline">Careers Portal</span>
            </a>
          )}

          {/* Tenant Switcher — interactive dropdown only when more than one tenant exists. */}
          {tenantsList.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <Building2 size={16} className="text-slate-500" />
                <span>{activeTenant?.name || "Select Org"}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-md z-20">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  {tenantsList.map((tenant) => {
                    const isSelected = tenant.id === activeTenant?.id;
                    const tenantPrimaryColor = tenant.primaryColor || "#2563eb";
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => handleTenantChange(tenant.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold cursor-pointer ${
                          isSelected
                            ? ""
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: `${tenantPrimaryColor}15`,
                                color: tenantPrimaryColor,
                              }
                            : {}
                        }
                      >
                        <span>{tenant.name}</span>
                        {isSelected && (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: tenantPrimaryColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
              <Building2 size={16} className="text-slate-400" />
              <span>{activeTenant?.name || "Single Org"}</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
