
-- ENUMS
DO $$ BEGIN CREATE TYPE public.org_role AS ENUM ('owner','admin','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.plan_tier AS ENUM ('trial','starter','growth','scale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','canceled','paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.notification_category AS ENUM ('appointment','queue','billing','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  plan public.plan_tier NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  seat_limit int NOT NULL DEFAULT 5,
  timezone text NOT NULL DEFAULT 'UTC',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ALTER existing tables FIRST (so helpers can reference new columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category public.notification_category DEFAULT 'system';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.consultation_notes ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = _org_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.org_role(_org_id uuid, _user_id uuid)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members WHERE org_id = _org_id AND user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = _org_id AND user_id = _user_id AND role IN ('owner','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT current_org_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- RLS for orgs & members
DROP POLICY IF EXISTS "Members view their orgs" ON public.organizations;
CREATE POLICY "Members view their orgs" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id, auth.uid()));
DROP POLICY IF EXISTS "Authenticated users create orgs" ON public.organizations;
CREATE POLICY "Authenticated users create orgs" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Admins update their org" ON public.organizations;
CREATE POLICY "Admins update their org" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(id, auth.uid())) WITH CHECK (public.is_org_admin(id, auth.uid()));
DROP POLICY IF EXISTS "Owners delete their org" ON public.organizations;
CREATE POLICY "Owners delete their org" ON public.organizations FOR DELETE TO authenticated
  USING (public.org_role(id, auth.uid()) = 'owner');

DROP POLICY IF EXISTS "Members view org membership" ON public.organization_members;
CREATE POLICY "Members view org membership" ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
DROP POLICY IF EXISTS "Admins manage members" ON public.organization_members;
CREATE POLICY "Admins manage members" ON public.organization_members FOR ALL TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()))
  WITH CHECK (public.is_org_admin(org_id, auth.uid()) OR auth.uid() = user_id);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan public.plan_tier NOT NULL DEFAULT 'trial',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  seats int NOT NULL DEFAULT 5,
  current_period_end timestamptz,
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view their subscription" ON public.subscriptions;
CREATE POLICY "Members view their subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
DROP POLICY IF EXISTS "Admins update subscription" ON public.subscriptions;
CREATE POLICY "Admins update subscription" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));

-- usage_counters
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  appointments_count int NOT NULL DEFAULT 0,
  sms_count int NOT NULL DEFAULT 0,
  active_users_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, period_start)
);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view usage" ON public.usage_counters;
CREATE POLICY "Members view usage" ON public.usage_counters FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (org_id IS NULL OR public.is_org_admin(org_id, auth.uid()));
DROP POLICY IF EXISTS "Members create audit logs" ON public.audit_logs;
CREATE POLICY "Members create audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id AND (org_id IS NULL OR public.is_org_member(org_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.log_audit(
  _org_id uuid, _action text, _entity_type text, _entity_id text, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.audit_logs (org_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (_org_id, auth.uid(), _action, _entity_type, _entity_id, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- login_events
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_events_user ON public.login_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own login events" ON public.login_events;
CREATE POLICY "Users view own login events" ON public.login_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own login events" ON public.login_events;
CREATE POLICY "Users insert own login events" ON public.login_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category public.notification_category NOT NULL,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notif prefs" ON public.notification_preferences;
CREATE POLICY "Users manage own notif prefs" ON public.notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- permissions_overrides
CREATE TABLE IF NOT EXISTS public.permissions_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissions_overrides TO authenticated;
GRANT ALL ON public.permissions_overrides TO service_role;
ALTER TABLE public.permissions_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members view permissions" ON public.permissions_overrides;
CREATE POLICY "Members view permissions" ON public.permissions_overrides FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
DROP POLICY IF EXISTS "Admins manage permissions" ON public.permissions_overrides;
CREATE POLICY "Admins manage permissions" ON public.permissions_overrides FOR ALL TO authenticated
  USING (public.is_org_admin(org_id, auth.uid())) WITH CHECK (public.is_org_admin(org_id, auth.uid()));

-- BACKFILL
DO $$
DECLARE _default_org uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'default') THEN
    INSERT INTO public.organizations (name, slug, plan, trial_ends_at, seat_limit)
    VALUES ('Default Organization','default','trial', now() + interval '14 days', 25)
    RETURNING id INTO _default_org;
  ELSE
    SELECT id INTO _default_org FROM public.organizations WHERE slug = 'default';
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role)
  SELECT _default_org, p.user_id,
    CASE WHEN public.has_role(p.user_id, 'admin') THEN 'owner'::public.org_role
         WHEN public.is_staff(p.user_id) THEN 'admin'::public.org_role
         ELSE 'member'::public.org_role END
  FROM public.profiles p
  ON CONFLICT (org_id, user_id) DO NOTHING;

  UPDATE public.profiles SET current_org_id = _default_org WHERE current_org_id IS NULL;
  UPDATE public.clinics SET organization_id = _default_org WHERE organization_id IS NULL;
  UPDATE public.appointments SET organization_id = _default_org WHERE organization_id IS NULL;
  UPDATE public.queue_entries SET organization_id = _default_org WHERE organization_id IS NULL;
  UPDATE public.consultation_notes SET organization_id = _default_org WHERE organization_id IS NULL;

  INSERT INTO public.subscriptions (org_id, plan, status, seats, trial_ends_at)
  VALUES (_default_org,'trial','trialing',25, now() + interval '14 days')
  ON CONFLICT (org_id) DO NOTHING;
END $$;

ALTER TABLE public.clinics ALTER COLUMN organization_id SET NOT NULL;

-- Triggers
DROP TRIGGER IF EXISTS trg_organizations_updated ON public.organizations;
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fill_org_from_clinic()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.clinic_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.clinics WHERE id = NEW.clinic_id;
  END IF;
  IF NEW.organization_id IS NULL THEN
    SELECT current_org_id INTO NEW.organization_id FROM public.profiles WHERE user_id = auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_appointments_fill_org ON public.appointments;
CREATE TRIGGER trg_appointments_fill_org BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_clinic();
DROP TRIGGER IF EXISTS trg_queue_fill_org ON public.queue_entries;
CREATE TRIGGER trg_queue_fill_org BEFORE INSERT ON public.queue_entries
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_clinic();
DROP TRIGGER IF EXISTS trg_notes_fill_org ON public.consultation_notes;
CREATE TRIGGER trg_notes_fill_org BEFORE INSERT ON public.consultation_notes
  FOR EACH ROW EXECUTE FUNCTION public.fill_org_from_clinic();

-- New-user handler: also creates personal org
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org_id uuid; _name text; _slug text;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));

  INSERT INTO public.profiles (user_id, full_name, phone, avatar_url)
  VALUES (NEW.id, COALESCE(_name, NEW.email), NEW.phone, NEW.raw_user_meta_data->>'avatar_url');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');

  _slug := lower(regexp_replace(COALESCE(_name, NEW.email), '[^a-zA-Z0-9]+','-','g')) || '-' || substring(NEW.id::text,1,8);
  INSERT INTO public.organizations (name, slug, plan, trial_ends_at, seat_limit, created_by)
  VALUES (COALESCE(_name, NEW.email) || '''s Workspace', _slug, 'trial', now() + interval '14 days', 5, NEW.id)
  RETURNING id INTO _org_id;

  INSERT INTO public.organization_members (org_id, user_id, role, invited_by)
  VALUES (_org_id, NEW.id, 'owner', NEW.id);

  INSERT INTO public.subscriptions (org_id, plan, status, seats, trial_ends_at)
  VALUES (_org_id, 'trial', 'trialing', 5, now() + interval '14 days');

  UPDATE public.profiles SET current_org_id = _org_id WHERE user_id = NEW.id;

  INSERT INTO public.notification_preferences (user_id, category)
  SELECT NEW.id, c FROM unnest(ARRAY['appointment','queue','billing','system']::public.notification_category[]) AS c
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
