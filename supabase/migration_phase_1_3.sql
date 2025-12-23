-- =============================================================================
-- MIGRATION: Phase 1.3 - Multi-Agency Role Management
-- =============================================================================
-- Run this migration in Supabase SQL Editor
-- =============================================================================

-- STEP 1: Add owner_id column to agencies table
-- This allows an Admin to own multiple agencies
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON public.agencies(owner_id);

-- =============================================================================
-- STEP 2: Update RLS Policies for Role-Based Access
-- =============================================================================

-- 2.1 AGENCIES TABLE POLICIES
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own agency" ON public.agencies;
DROP POLICY IF EXISTS "Users can update own agency" ON public.agencies;
DROP POLICY IF EXISTS "Any authenticated user can create an agency" ON public.agencies;

-- Superuser: Can view ALL agencies
CREATE POLICY "Superuser can view all agencies" ON public.agencies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Admin: Can view agencies they OWN
CREATE POLICY "Admin can view owned agencies" ON public.agencies FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- Agent: Can view only their assigned agency
CREATE POLICY "Agent can view assigned agency" ON public.agencies FOR SELECT
  USING (
    id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND role = 'agent')
  );

-- Admin: Can update agencies they own
CREATE POLICY "Admin can update owned agencies" ON public.agencies FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Admin: Can create new agencies (they become the owner)
CREATE POLICY "Admin can create agencies" ON public.agencies FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superuser'))
  );

-- =============================================================================
-- 2.2 PROPERTIES TABLE POLICIES - Enhanced for multi-agency admin access
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own agency properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own agency properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own agency properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own agency properties" ON public.properties;

-- Superuser: Can view ALL properties
CREATE POLICY "Superuser can view all properties" ON public.properties FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Admin: Can view properties from all agencies they own
CREATE POLICY "Admin can view owned agencies properties" ON public.properties FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Agent: Can view only properties from their assigned agency
CREATE POLICY "Agent can view assigned agency properties" ON public.properties FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT: Must be for an agency the user has access to
CREATE POLICY "Users can insert properties in accessible agencies" ON public.properties FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- UPDATE: Same as INSERT
CREATE POLICY "Users can update properties in accessible agencies" ON public.properties FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- DELETE: Same as UPDATE
CREATE POLICY "Users can delete properties in accessible agencies" ON public.properties FOR DELETE
  USING (
    agency_id IN (
      SELECT id FROM public.agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- =============================================================================
-- 2.3 PROFILES TABLE POLICIES - Allow admins to view agents in their agencies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Admins can view profiles of agents in their agencies
CREATE POLICY "Admin can view agency agents" ON public.profiles FOR SELECT
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- =============================================================================
-- 2.4 PORTALS_CONFIG POLICIES - Only if table exists
-- =============================================================================

DO $$
BEGIN
  -- Check if portals_config table exists before modifying policies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portals_config') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own agency portal config" ON public.portals_config;
    DROP POLICY IF EXISTS "Users can insert own agency portal config" ON public.portals_config;
    DROP POLICY IF EXISTS "Users can update own agency portal config" ON public.portals_config;

    -- View: Agency owner or member
    CREATE POLICY "Users can view accessible agency portal config" ON public.portals_config FOR SELECT
      USING (
        agency_id IN (
          SELECT id FROM public.agencies WHERE owner_id = auth.uid()
          UNION
          SELECT agency_id FROM public.profiles WHERE id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
      );

    -- Insert: Only admin/superuser
    CREATE POLICY "Admin can insert agency portal config" ON public.portals_config FOR INSERT
      WITH CHECK (
        agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
      );

    -- Update: Only admin/superuser
    CREATE POLICY "Admin can update agency portal config" ON public.portals_config FOR UPDATE
      USING (
        agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser')
      );
    
    RAISE NOTICE 'portals_config policies updated.';
  ELSE
    RAISE NOTICE 'portals_config table does not exist - skipping policies.';
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Update handle_new_user trigger to assign 'agent' role by default
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'agent')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, so we don't need to recreate it
-- It will use the updated function automatically

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Next steps:
-- 1. Create test users in Supabase Dashboard (Authentication > Users)
-- 2. Run seed_test_accounts.sql with the real user UUIDs
-- =============================================================================
