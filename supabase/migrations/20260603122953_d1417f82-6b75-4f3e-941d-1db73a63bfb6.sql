-- Invitations status enum
DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.organization_invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON public.organization_invitations(token);

GRANT SELECT ON public.organization_invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view org invitations"
  ON public.organization_invitations FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "Anon lookup by token"
  ON public.organization_invitations FOR SELECT TO anon
  USING (true);

CREATE POLICY "Admins create invitations"
  ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(org_id, auth.uid()) AND auth.uid() = invited_by);

CREATE POLICY "Admins update invitations"
  ON public.organization_invitations FOR UPDATE TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()))
  WITH CHECK (public.is_org_admin(org_id, auth.uid()));

CREATE POLICY "Admins delete invitations"
  ON public.organization_invitations FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id, auth.uid()));

-- Accept invitation: marks accepted and adds membership
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _inv public.organization_invitations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _inv FROM public.organization_invitations
   WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF _inv.status <> 'pending' THEN RAISE EXCEPTION 'Invitation not pending'; END IF;
  IF _inv.expires_at < now() THEN
    UPDATE public.organization_invitations SET status='expired' WHERE id=_inv.id;
    RAISE EXCEPTION 'Invitation expired';
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
END $$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;