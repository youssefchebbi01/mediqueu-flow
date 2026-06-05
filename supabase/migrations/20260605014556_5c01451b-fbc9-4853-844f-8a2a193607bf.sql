
-- 1) Replace anon-readable invitations with a SECURITY DEFINER lookup RPC
DROP POLICY IF EXISTS "Anon lookup by token" ON public.organization_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role public.org_role,
  status text,
  expires_at timestamptz,
  org_id uuid,
  org_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.role, i.status, i.expires_at, i.org_id, o.name AS org_name
  FROM public.organization_invitations i
  LEFT JOIN public.organizations o ON o.id = i.org_id
  WHERE i.token = _token
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

-- 2) Invitation hijacking: enforce email ownership inside accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _inv public.organization_invitations%ROWTYPE; _caller_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT email INTO _caller_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO _inv FROM public.organization_invitations
   WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF _inv.status <> 'pending' THEN RAISE EXCEPTION 'Invitation not pending'; END IF;
  IF _inv.expires_at < now() THEN
    UPDATE public.organization_invitations SET status='expired' WHERE id=_inv.id;
    RAISE EXCEPTION 'Invitation expired';
  END IF;
  IF lower(COALESCE(_caller_email,'')) <> lower(_inv.email) THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;

  INSERT INTO public.organization_members (org_id, user_id, role, invited_by)
  VALUES (_inv.org_id, auth.uid(), _inv.role, _inv.invited_by)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.organization_invitations
     SET status='accepted', accepted_at=now(), accepted_by=auth.uid()
   WHERE id = _inv.id;

  UPDATE public.profiles SET current_org_id = _inv.org_id WHERE user_id = auth.uid();

  PERFORM public.log_audit(_inv.org_id, 'invitation.accepted', 'invitation', _inv.id::text,
    jsonb_build_object('role', _inv.role, 'email', _inv.email));

  RETURN _inv.org_id;
END $function$;

-- 3) log_audit: enforce caller is a member of the target org
CREATE OR REPLACE FUNCTION public.log_audit(_org_id uuid, _action text, _entity_type text, _entity_id text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _org_id IS NULL OR NOT public.is_org_member(_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;
  INSERT INTO public.audit_logs (org_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (_org_id, auth.uid(), _action, _entity_type, _entity_id, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END $function$;

-- 4) audit_logs: remove null-org oversharing for admins
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_admin(org_id, auth.uid()));

-- 5) permissions_overrides: restrict SELECT to org admins only
DROP POLICY IF EXISTS "Members view permissions" ON public.permissions_overrides;
CREATE POLICY "Admins view permissions"
  ON public.permissions_overrides FOR SELECT TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()));

-- 6) subscriptions: hide stripe ids — restrict full row SELECT to admins; expose safe view to members
DROP POLICY IF EXISTS "Members view their subscription" ON public.subscriptions;
CREATE POLICY "Admins view subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()));

CREATE OR REPLACE VIEW public.subscriptions_public
WITH (security_invoker = true)
AS
  SELECT id, org_id, plan, status, seats, trial_ends_at, current_period_end, created_at, updated_at
  FROM public.subscriptions
  WHERE public.is_org_member(org_id, auth.uid());

GRANT SELECT ON public.subscriptions_public TO authenticated;

-- 7) user_roles: prevent self-modification even by admins (no self-escalation/de-escalation)
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND user_id <> auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND user_id <> auth.uid());
