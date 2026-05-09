
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('patient','receptionist','doctor','admin');

CREATE TYPE public.appointment_status AS ENUM
  ('Pending','Confirmed','Waiting','In Consultation','Completed','Cancelled','No Show');

CREATE TYPE public.queue_status AS ENUM
  ('Waiting','Active','Completed','Delayed');

-- =========================================================
-- CLINICS
-- =========================================================
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  date_of_birth date,
  specialty text,
  license_number text,
  department text,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES (separate table — security best practice)
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience: is_staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('receptionist','doctor','admin')
  )
$$;

-- =========================================================
-- SPECIALTIES (catalogue)
-- =========================================================
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- DOCTORS DIRECTORY (public booking directory)
-- =========================================================
CREATE TABLE public.doctors_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  specialty text NOT NULL,
  avatar text,
  rating numeric(3,2) DEFAULT 4.8,
  available boolean DEFAULT true,
  next_slot text,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors_directory ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- APPOINTMENTS
-- =========================================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors_directory(id) ON DELETE SET NULL,
  doctor_name text NOT NULL,
  specialty text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'Pending',
  reason text,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);

-- =========================================================
-- QUEUE ENTRIES
-- =========================================================
CREATE TABLE public.queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket text NOT NULL,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors_directory(id) ON DELETE SET NULL,
  doctor_name text,
  position int NOT NULL DEFAULT 0,
  status public.queue_status NOT NULL DEFAULT 'Waiting',
  eta_min int DEFAULT 0,
  arrived_at timestamptz NOT NULL DEFAULT now(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_queue_patient ON public.queue_entries(patient_id);
CREATE INDEX idx_queue_status ON public.queue_entries(status);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id);

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doctors_dir_updated BEFORE UPDATE ON public.doctors_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_queue_updated BEFORE UPDATE ON public.queue_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- New user trigger -> create profile + default 'patient' role
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- CLINICS
CREATE POLICY "Authenticated users can view clinics"
  ON public.clinics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage clinics"
  ON public.clinics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFILES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- USER ROLES
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SPECIALTIES
CREATE POLICY "Anyone authed can view specialties"
  ON public.specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage specialties"
  ON public.specialties FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- DOCTORS DIRECTORY
CREATE POLICY "Anyone authed can view doctors"
  ON public.doctors_directory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage doctors"
  ON public.doctors_directory FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- APPOINTMENTS
CREATE POLICY "Patients view own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR public.is_staff(auth.uid()));
CREATE POLICY "Patients create own appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id OR public.is_staff(auth.uid()));
CREATE POLICY "Patients update own pending appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = patient_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = patient_id);

-- QUEUE ENTRIES
CREATE POLICY "Patients view own queue, staff view all"
  ON public.queue_entries FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage queue"
  ON public.queue_entries FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Patients can join queue"
  ON public.queue_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- NOTIFICATIONS
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Staff create notifications for anyone"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = user_id);

-- =========================================================
-- REALTIME (queue + appointments + notifications)
-- =========================================================
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
