-- Migration: Add home_address column to people table
-- Date: 2026-02-26
-- Description: Adds home_address field to support travel time / distance-aware scheduling.
--              Used by the AI scheduling agent (Phase 6) to calculate commute time from
--              a person's home to the job site via Google Maps API.

ALTER TABLE people
ADD COLUMN home_address TEXT;

COMMENT ON COLUMN people.home_address IS 'Full home address used for travel time calculation in AI-powered scheduling (e.g. "123 Main St, San Francisco, CA 94105")';

-- Verify the column was added
-- Run this to check:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'people' AND column_name = 'home_address';
