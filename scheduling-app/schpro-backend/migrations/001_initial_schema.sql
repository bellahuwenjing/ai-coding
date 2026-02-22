-- =====================================================
-- SchedulePro - Complete Supabase Database Schema
-- PostgreSQL with Correct RLS Policies
-- =====================================================
--
-- IMPORTANT NOTES ABOUT RLS:
-- 1. Helper function must be in 'public' schema (not 'auth' - permission denied)
-- 2. After authentication, users have 'authenticated' role (not 'public')
-- 3. During registration, user_company_id() returns NULL (no person record yet)
--    so SELECT policies must handle this case
-- 4. Use 'TO authenticated' for policies that apply after login
-- =====================================================

-- Drop existing tables (if any)
DROP TABLE IF EXISTS booking_equipment CASCADE;
DROP TABLE IF EXISTS booking_vehicles CASCADE;
DROP TABLE IF EXISTS booking_people CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop helper function if exists
DROP FUNCTION IF EXISTS public.user_company_id() CASCADE;

-- =====================================================
-- 1. Companies Table
-- =====================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 2. People Table
-- =====================================================
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'member',
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(company_id, email)
);

-- =====================================================
-- 3. Vehicles Table
-- =====================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  license_plate VARCHAR(50),
  vin VARCHAR(100),
  capacity INTEGER,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 4. Equipment Table
-- =====================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'good',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- 5. Bookings Table
-- =====================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  requirements JSONB DEFAULT '{}'::jsonb,  -- Resource requirements for AI scheduling
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- COMMENT: requirements JSONB structure:
-- {
--   "people": [{ "role": "welder", "skills": ["welding"], "certifications": ["AWS D1.1"], "quantity": 2 }],
--   "vehicles": [{ "type": "van", "min_capacity": 8, "quantity": 1 }],
--   "equipment": [{ "type": "welder", "min_condition": "good", "quantity": 2 }]
-- }

-- =====================================================
-- 6. Junction Tables
-- =====================================================

-- Booking-People Junction
CREATE TABLE booking_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, person_id)
);

-- Booking-Vehicles Junction
CREATE TABLE booking_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, vehicle_id)
);

-- Booking-Equipment Junction
CREATE TABLE booking_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, equipment_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_people_company_id ON people(company_id);
CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_equipment_company_id ON equipment(company_id);
CREATE INDEX idx_bookings_company_id ON bookings(company_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_booking_people_booking_id ON booking_people(booking_id);
CREATE INDEX idx_booking_people_person_id ON booking_people(person_id);
CREATE INDEX idx_booking_vehicles_booking_id ON booking_vehicles(booking_id);
CREATE INDEX idx_booking_vehicles_vehicle_id ON booking_vehicles(vehicle_id);
CREATE INDEX idx_booking_equipment_booking_id ON booking_equipment(booking_id);
CREATE INDEX idx_booking_equipment_equipment_id ON booking_equipment(equipment_id);

-- =====================================================
-- Functions for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Helper Function for RLS (Prevents Infinite Recursion)
-- =====================================================
-- IMPORTANT: Must be in 'public' schema (not 'auth' - permission denied)
-- SECURITY DEFINER allows it to bypass RLS when looking up company_id
-- STABLE means it can be cached during a single query
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.people WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_equipment ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Companies
-- =====================================================

-- SELECT: Allow viewing own company OR during registration (when user_company_id() is NULL)
-- During registration, user hasn't created a person record yet, so user_company_id() returns NULL
CREATE POLICY "Users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id = public.user_company_id() OR public.user_company_id() IS NULL
  );

-- INSERT: Allow authenticated users to create companies during registration
-- IMPORTANT: Must be TO authenticated (not TO public) because after signUp,
-- users have 'authenticated' role, not 'public' role
CREATE POLICY "Allow authenticated to insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only allow updating own company
CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (id = public.user_company_id());

-- =====================================================
-- RLS Policies - People (Fixed - No Recursion)
-- =====================================================

-- SELECT: View own record OR view people in same company
CREATE POLICY "Users can view own record"
  ON people FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view company people"
  ON people FOR SELECT
  TO authenticated
  USING (company_id = public.user_company_id());

-- INSERT: Allow registration (insert own record) OR insert people in company
CREATE POLICY "Allow registration insert"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert company people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.user_company_id());

-- UPDATE: Allow updating people in own company
CREATE POLICY "Users can update company people"
  ON people FOR UPDATE
  TO authenticated
  USING (company_id = public.user_company_id());

-- DELETE: Allow deleting people in own company
CREATE POLICY "Users can delete company people"
  ON people FOR DELETE
  TO authenticated
  USING (company_id = public.user_company_id());

-- =====================================================
-- RLS Policies - Vehicles
-- =====================================================
CREATE POLICY "Users can view company vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can insert company vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "Users can update company vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can delete company vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (company_id = public.user_company_id());

-- =====================================================
-- RLS Policies - Equipment
-- =====================================================
CREATE POLICY "Users can view company equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can insert company equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "Users can update company equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can delete company equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (company_id = public.user_company_id());

-- =====================================================
-- RLS Policies - Bookings
-- =====================================================
CREATE POLICY "Users can view company bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can insert company bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "Users can update company bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "Users can delete company bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (company_id = public.user_company_id());

-- =====================================================
-- RLS Policies - Junction Tables
-- =====================================================
CREATE POLICY "Users can manage company booking_people"
  ON booking_people FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_people.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_people.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  );

CREATE POLICY "Users can manage company booking_vehicles"
  ON booking_vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_vehicles.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_vehicles.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  );

CREATE POLICY "Users can manage company booking_equipment"
  ON booking_equipment FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_equipment.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_equipment.booking_id
      AND bookings.company_id = public.user_company_id()
    )
  );

-- =====================================================
-- Done!
-- =====================================================
-- You can now:
-- 1. Register a new user (creates auth user, company, person)
-- 2. Login automatically or via email confirmation
-- 3. Create people, vehicles, equipment
-- 4. Create bookings with assigned resources
-- 5. Multi-tenancy is enforced automatically via RLS
-- =====================================================
