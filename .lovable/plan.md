## Phase 3: SaaS Readiness & Multi-Tenant Foundations

Scope is large. I'll deliver it in 4 migration-safe steps. Existing single-clinic data stays intact — every current clinic becomes a clinic under a new auto-created default organization, so nothing breaks.

### Step 1 — Schema (one migration)

New tables (all RLS-enabled, scoped via security-definer helpers to avoid recursion):

- `organizations` — id, name, slug, logo_url, plan (`trial`|`starter`|`growth`|`scale`), trial_ends_at, seat_limit, timezone, created_at
- `organization_members` — org_id, user_id, role (`owner`|`admin`|`member`), invited_by, joined_at (unique on org_id+user_id)
- `audit_logs` — org_id, actor_id, action, entity_type, entity_id, metadata jsonb, created_at (indexed on org_id+created_at)
- `subscriptions` — org_id (unique), plan, status, seats, current_period_end, stripe_customer_id (nullable, for future Stripe), trial_ends_at
- `usage_counters` — org_id, period_start, appointments_count, sms_count, active_users_count (recomputed nightly / on write)
- `login_events` — user_id, ip, user_agent, event (`signin`|`signout`|`refresh`), created_at
- `notification_preferences` — user_id, channel (`appointment`|`queue`|`billing`|`system`), email_enabled, sms_enabled, in_app_enabled
- `permissions_overrides` — org_id, user_id, permission_key, allowed (for granular custom permissions on top of base roles)

Alterations:
- `clinics.organization_id` (nullable→backfilled→not null) — clinics now belong to an organization
- `profiles.current_org_id` — last-active org for the switcher
- `notifications.category` — `appointment`|`queue`|`billing`|`system`
- `appointments`, `queue_entries`, `consultation_notes` — add `organization_id` (denormalized via trigger from clinic_id) for fast org-scoped queries + RLS

Helpers:
- `is_org_member(org_id, user_id)` SECURITY DEFINER
- `org_role(org_id, user_id)` returns text
- `current_org_id()` returns `profiles.current_org_id` for `auth.uid()`
- `log_audit(action, entity_type, entity_id, metadata)` helper
- Trigger on `auth.users` insert: create default org "{full_name}'s Workspace", add as `owner`, set `current_org_id`, seed trial subscription (14-day)

Backfill: existing clinics → one "Default Organization", all existing users added as members based on their current role.

### Step 2 — Server functions (`src/lib/*.functions.ts`)

- `org.functions.ts` — `listMyOrgs`, `switchOrg`, `createOrg`, `inviteMember`, `updateOrgSettings`, `removeMember`, `updateMemberRole`
- `billing.functions.ts` — `getSubscription`, `getUsage`, `startTrial`, `requestUpgrade` (logs intent; Stripe wired later)
- `audit.functions.ts` — `listAuditLogs(filters, pagination)`
- `notifications.functions.ts` — `listNotifications`, `markRead`, `markAllRead`, `getPreferences`, `updatePreferences`
- `security.functions.ts` — `listLoginEvents`, `revokeOtherSessions` (calls `supabase.auth.admin.signOut` via admin client)
- `permissions.functions.ts` — `listPermissions`, `setOverride`

All use `requireSupabaseAuth` and verify org membership via `is_org_member`. Mutations call `log_audit`.

### Step 3 — UI

New routes:
- `/_authenticated/organization` — org settings (profile, branding upload, timezone, operating hours, locations placeholder, staff/members table)
- `/_authenticated/billing` — current plan card, usage meters (appointments / seats / SMS vs plan limits), plan comparison grid (Starter $49 / Growth $149 / Scale $399), trial banner, "Upgrade" CTA (toast: "Stripe coming soon")
- `/_authenticated/audit` — searchable, filterable audit log table (DataTable, date range, actor, action type)
- `/_authenticated/notifications` — inbox with tabs (All / Unread / by category), realtime via supabase channel, preferences panel
- `/_authenticated/security` — login history table, active sessions, "sign out all other devices", password change
- `/_authenticated/permissions` — matrix of roles × permission keys with toggles (admin only)

New components:
- `OrgSwitcher` — dropdown in `DashboardShell` topbar (avatar/logo + name + plan chip), lists user's orgs, "Create organization" action
- `NotificationBell` — topbar icon with unread badge, popover preview, link to inbox
- `TrialBanner` — sticky banner across dashboards when `trial_ends_at` < 7 days
- `UsageMeter` — progress bar primitive for billing page
- `PlanBadge` — small chip used in switcher & billing

`DashboardShell` updates:
- Add `OrgSwitcher` (left of title) and `NotificationBell` (right of search)
- Add nav entries: Organization, Billing, Audit, Security (admin/owner only via `useOrgRole` hook)
- Trial banner mount point above content

New hook: `useCurrentOrg()` — fetches `profiles.current_org_id` + org row + my role; cached via React Query, invalidated on switch.

Existing pages (reception/doctor/admin/queue) gain a thin org filter — they automatically scope to `current_org_id` via the new RLS, no UI change required.

### Step 4 — Audit instrumentation

Every existing mutation (appointment status change, queue add/move, role assignment, settings save, member invite/remove) wraps in `log_audit(...)`. Done inside the server functions, not client-side, so it can't be bypassed.

### Out of scope (called out for Phase 4)
- Actual Stripe checkout / webhooks — only scaffold + "coming soon" upgrade CTA
- Real custom domain branding / white-label
- SCIM / SSO provisioning (SAML already supported via Supabase)
- Real multi-location routing (table prepared, UI says "coming soon")

### Risks & mitigations
- **Backfill correctness** — single migration, transactional, default org per existing clinic owner
- **RLS recursion on org_members** — uses `is_org_member` SECURITY DEFINER, mirrors existing `has_role` pattern
- **Performance** — `organization_id` denormalized onto appointments/queue with indexes; audit_logs indexed on (org_id, created_at desc)

If approved, I'll ship Step 1 (migration) first, then Steps 2–4 in a single follow-up after you accept the migration.