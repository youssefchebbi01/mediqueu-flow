-- consultation_notes table
CREATE TABLE public.consultation_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors_directory(id) ON DELETE SET NULL,
  doctor_user_id UUID,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment TEXT,
  prescription TEXT,
  notes TEXT,
  follow_up_date DATE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own notes"
  ON public.consultation_notes FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR public.is_staff(auth.uid()));

CREATE POLICY "Staff create notes"
  ON public.consultation_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update notes"
  ON public.consultation_notes FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Admins delete notes"
  ON public.consultation_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_consultation_notes_updated_at
  BEFORE UPDATE ON public.consultation_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);

CREATE INDEX IF NOT EXISTS idx_queue_patient ON public.queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_doctor ON public.queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON public.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_position ON public.queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_queue_clinic ON public.queue_entries(clinic_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic ON public.profiles(clinic_id);

CREATE INDEX IF NOT EXISTS idx_doctors_user ON public.doctors_directory(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors_directory(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON public.doctors_directory(clinic_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient ON public.consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment ON public.consultation_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor ON public.consultation_notes(doctor_id);

-- Realtime for consultation_notes
ALTER TABLE public.consultation_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_notes;