-- Migration: Add requirements column to bookings table
-- Date: 2026-02-15
-- Description: Adds JSONB requirements field to support structured resource requirements
--              for AI-powered optimal scheduling and CSP-based resource assignment

-- Add requirements column with default empty object
ALTER TABLE bookings
ADD COLUMN requirements JSONB DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN bookings.requirements IS 'Structured resource requirements: { people: [{ role, skills, certifications, quantity }], vehicles: [{ type, min_capacity, quantity }], equipment: [{ type, min_condition, quantity }] }';

-- Optional: Create a GIN index for efficient JSONB querying if needed in future
-- (Commented out for now - only add if you need to query requirements frequently)
-- CREATE INDEX idx_bookings_requirements ON bookings USING GIN (requirements);

-- Verify the column was added
-- Run this to check:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bookings' AND column_name = 'requirements';
