-- Migration: Make user_id nullable in people table
-- This allows people to be schedulable resources without requiring a user account

-- Make user_id nullable
ALTER TABLE people ALTER COLUMN user_id DROP NOT NULL;

-- Update the RLS policies to handle nullable user_id
-- Since we disabled RLS, this is just for documentation

-- Note: The people table now supports two types of records:
-- 1. Users: people with user_id (created during registration)
-- 2. Resources: people without user_id (created manually for scheduling)
