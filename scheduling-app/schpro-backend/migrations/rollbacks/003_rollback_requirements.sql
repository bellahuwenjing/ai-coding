-- Rollback Migration: Remove requirements column from bookings table
-- Date: 2026-02-15
-- Description: Removes the requirements JSONB column if migration needs to be rolled back
-- WARNING: This will permanently delete all requirements data!

-- Drop the GIN index if it was created
-- DROP INDEX IF EXISTS idx_bookings_requirements;

-- Remove the requirements column
ALTER TABLE bookings
DROP COLUMN IF EXISTS requirements;

-- Verify the column was removed
-- Run this to check:
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'bookings' AND column_name = 'requirements';
-- (Should return no rows)
