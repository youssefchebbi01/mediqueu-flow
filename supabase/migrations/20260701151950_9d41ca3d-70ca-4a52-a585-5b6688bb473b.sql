
-- Scope staff profile access to the caller's current organization
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR (
    public.is_staff(auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.user_id = public.profiles.user_id
        AND om.org_id = public.current_org_id()
    )
  )
);
