/**
 * Tenant type definitions.
 *
 * Models a tenant (organization) and its brandable settings. Consumed via named
 * imports and re-exported by the middleware barrel.
 */

/** A tenant organization, including custom-branding fields (logo, colors). */
export interface Tenant {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  address: string;
  /** Organization logo URL, or null when none has been uploaded. */
  logoURL: string | null;
  primaryColor?: string;
  supportEmail?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tenant plus extended settings. Currently augments {@link Tenant} with optional
 * theming fields; intended to grow (billing, customizations) in later phases.
 */
export interface TenantSettings extends Tenant {
  // Can be extended for billing, customizations, etc. in Phase 1
  primaryColor?: string;
  borderRadius?: string;
}
