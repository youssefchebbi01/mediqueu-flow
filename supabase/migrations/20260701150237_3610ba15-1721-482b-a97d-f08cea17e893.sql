
-- ===========================================================================
-- 1. SECURITY DEFINER function access hardening
-- ===========================================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.org_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) TO authenticated;

-- ===========================================================================
-- 2. Cross-organization access
-- ===========================================================================

-- Appointments
DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients update own pending appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff delete appointments" ON public.appointments;

CREATE POLICY "Patients view own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

CREATE POLICY "Patients create own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

CREATE POLICY "Patients update own pending appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  )
  WITH CHECK (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

CREATE POLICY "Staff delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

-- Queue entries
DROP POLICY IF EXISTS "Patients view own queue, staff view all" ON public.queue_entries;
DROP POLICY IF EXISTS "Patients view own queue, staff view org queue" ON public.queue_entries;
DROP POLICY IF EXISTS "Staff manage queue" ON public.queue_entries;
DROP POLICY IF EXISTS "Patients can join queue" ON public.queue_entries;

CREATE POLICY "Patients view own queue, staff view org queue"
  ON public.queue_entries FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

CREATE POLICY "Patients can join queue"
  ON public.queue_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Staff manage queue"
  ON public.queue_entries FOR ALL TO authenticated
  USING (
    is_staff(auth.uid())
    AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid()))
  )
  WITH CHECK (
    is_staff(auth.uid())
    AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid()))
  );

-- Consultation notes
DROP POLICY IF EXISTS "Patients view own notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Staff create notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Staff update notes" ON public.consultation_notes;
DROP POLICY IF EXISTS "Admins delete notes" ON public.consultation_notes;

CREATE POLICY "Patients view own notes"
  ON public.consultation_notes FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR (is_staff(auth.uid())
        AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid())))
  );

CREATE POLICY "Staff create notes"
  ON public.consultation_notes FOR INSERT TO authenticated
  WITH CHECK (
    is_staff(auth.uid())
    AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid()))
  );

CREATE POLICY "Staff update notes"
  ON public.consultation_notes FOR UPDATE TO authenticated
  USING (
    is_staff(auth.uid())
    AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid()))
  )
  WITH CHECK (
    is_staff(auth.uid())
    AND (organization_id IS NULL OR is_org_member(organization_id, auth.uid()))
  );

CREATE POLICY "Admins delete notes"
  ON public.consultation_notes FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================================================
-- 3. Clinics — restrict to organization members
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated users can view clinics" ON public.clinics;

CREATE POLICY "Members view their org clinics"
  ON public.clinics FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR is_org_member(organization_id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ===========================================================================
-- 4. user_roles — explicit per-command policies preventing self-escalation
-- ===========================================================================
DROP POLICY IF EXISTS "admin write roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() <> user_id
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    auth.uid() <> user_id
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    auth.uid() <> user_id
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (
    auth.uid() <> user_id
    AND has_role(auth.uid(), 'admin'::app_role)
  );
