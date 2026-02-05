-- SchedulePro Database Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================================================
-- 1. COMPANIES TABLE
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);

-- Note: RLS policies for companies will be added after people table is created

-- ============================================================================
-- 2. PEOPLE TABLE (Users + Schedulable Resources)
-- ============================================================================

CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Core identity
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,

    -- Resource scheduling fields
    phone TEXT,
    skills JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    hourly_rate DECIMAL(10,2),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_people_company_id ON people(company_id);
CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_is_deleted ON people(is_deleted);

-- Enable Row Level Security
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see people in their company
CREATE POLICY "Users can view people in their company"
    ON people FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- RLS Policy: Users can insert people in their company
CREATE POLICY "Users can insert people in their company"
    ON people FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- RLS Policy: Users can update people in their company
CREATE POLICY "Users can update people in their company"
    ON people FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- RLS Policy: Users can delete people in their company
CREATE POLICY "Users can delete people in their company"
    ON people FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- RLS POLICIES FOR COMPANIES TABLE (Created after people table exists)
-- ============================================================================

-- Enable Row Level Security on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own company
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- 3. VEHICLES TABLE
-- ============================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Vehicle details
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    capacity INTEGER,
    notes TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: license plate per company
    UNIQUE(company_id, license_plate)
);

CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_is_deleted ON vehicles(is_deleted);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as people)
CREATE POLICY "Users can view vehicles in their company"
    ON vehicles FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert vehicles in their company"
    ON vehicles FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update vehicles in their company"
    ON vehicles FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete vehicles in their company"
    ON vehicles FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- 4. EQUIPMENT TABLE
-- ============================================================================

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Equipment details
    name TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    type TEXT,
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: serial number per company
    UNIQUE(company_id, serial_number)
);

CREATE INDEX idx_equipment_company_id ON equipment(company_id);
CREATE INDEX idx_equipment_serial_number ON equipment(serial_number);
CREATE INDEX idx_equipment_is_deleted ON equipment(is_deleted);

-- Enable Row Level Security
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as people)
CREATE POLICY "Users can view equipment in their company"
    ON equipment FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert equipment in their company"
    ON equipment FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update equipment in their company"
    ON equipment FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete equipment in their company"
    ON equipment FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- 5. BOOKINGS TABLE
-- ============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Booking details
    title TEXT NOT NULL,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    notes TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: end_time must be after start_time
    CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_company_id ON bookings(company_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_bookings_is_deleted ON bookings(is_deleted);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as people)
CREATE POLICY "Users can view bookings in their company"
    ON bookings FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert bookings in their company"
    ON bookings FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update bookings in their company"
    ON bookings FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete bookings in their company"
    ON bookings FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM people WHERE user_id = auth.uid()
    ));

-- ============================================================================
-- 6. BOOKING_PEOPLE JUNCTION TABLE
-- ============================================================================

CREATE TABLE booking_people (
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (booking_id, person_id)
);

CREATE INDEX idx_booking_people_person_id ON booking_people(person_id);

-- Enable Row Level Security
ALTER TABLE booking_people ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access booking_people for bookings in their company
CREATE POLICY "Users can manage booking_people in their company"
    ON booking_people FOR ALL
    USING (booking_id IN (
        SELECT id FROM bookings WHERE company_id IN (
            SELECT company_id FROM people WHERE user_id = auth.uid()
        )
    ));

-- ============================================================================
-- 7. BOOKING_VEHICLES JUNCTION TABLE
-- ============================================================================

CREATE TABLE booking_vehicles (
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (booking_id, vehicle_id)
);

CREATE INDEX idx_booking_vehicles_vehicle_id ON booking_vehicles(vehicle_id);

-- Enable Row Level Security
ALTER TABLE booking_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage booking_vehicles in their company"
    ON booking_vehicles FOR ALL
    USING (booking_id IN (
        SELECT id FROM bookings WHERE company_id IN (
            SELECT company_id FROM people WHERE user_id = auth.uid()
        )
    ));

-- ============================================================================
-- 8. BOOKING_EQUIPMENT JUNCTION TABLE
-- ============================================================================

CREATE TABLE booking_equipment (
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (booking_id, equipment_id)
);

CREATE INDEX idx_booking_equipment_equipment_id ON booking_equipment(equipment_id);

-- Enable Row Level Security
ALTER TABLE booking_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage booking_equipment in their company"
    ON booking_equipment FOR ALL
    USING (booking_id IN (
        SELECT id FROM bookings WHERE company_id IN (
            SELECT company_id FROM people WHERE user_id = auth.uid()
        )
    ));

-- ============================================================================
-- DONE!
-- ============================================================================

-- Verify tables were created
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
