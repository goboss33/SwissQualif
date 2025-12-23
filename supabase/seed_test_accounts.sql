-- =============================================================================
-- SEED DATA: Test Accounts for Phase 1.3
-- =============================================================================
-- INSTRUCTIONS:
-- 1. First, create these 3 users in Supabase Dashboard (Authentication > Users):
--    - testdev@swissqualif.ch (password: your choice)
--    - testadmin@swissqualif.ch (password: your choice)
--    - testagent@swissqualif.ch (password: your choice)
-- 2. Copy their UUIDs from the dashboard
-- 3. Replace the placeholder UUIDs below with the real ones
-- 4. Run this script in Supabase SQL Editor
-- =============================================================================

-- PLACEHOLDER UUIDs - REPLACE WITH REAL ONES FROM SUPABASE DASHBOARD
-- Example format: '123e4567-e89b-12d3-a456-426614174000'
DO $$
DECLARE
    testdev_uuid uuid := '81ba7f2a-26de-445f-b7a4-695f7200d01f';
    testadmin_uuid uuid := 'a786d74d-dde9-49f7-b870-66e8672cf4ef';
    testagent_uuid uuid := '0fb60ea9-0ac0-420d-be3a-e49bcf8a997c';
    agency_lausanne_uuid uuid;
    agency_geneve_uuid uuid;
BEGIN
    -- ==========================================================================
    -- STEP 1: Update profile roles
    -- ==========================================================================
    
    -- Set testdev as superuser
    UPDATE public.profiles 
    SET role = 'superuser', full_name = 'Test SuperUser'
    WHERE id = testdev_uuid;
    
    -- Set testadmin as admin
    UPDATE public.profiles 
    SET role = 'admin', full_name = 'Test Admin'
    WHERE id = testadmin_uuid;
    
    -- Set testagent as agent (should already be agent by default)
    UPDATE public.profiles 
    SET role = 'agent', full_name = 'Test Agent'
    WHERE id = testagent_uuid;

    -- ==========================================================================
    -- STEP 2: Create test agencies owned by testadmin
    -- ==========================================================================
    
    -- Create Agence Lausanne
    INSERT INTO public.agencies (name, owner_id)
    VALUES ('Agence Lausanne', testadmin_uuid)
    RETURNING id INTO agency_lausanne_uuid;
    
    -- Create Agence Genève
    INSERT INTO public.agencies (name, owner_id)
    VALUES ('Agence Genève', testadmin_uuid)
    RETURNING id INTO agency_geneve_uuid;

    -- ==========================================================================
    -- STEP 3: Assign agencies to profiles
    -- ==========================================================================
    
    -- Assign testadmin to Agence Lausanne (as default working agency)
    UPDATE public.profiles 
    SET agency_id = agency_lausanne_uuid
    WHERE id = testadmin_uuid;
    
    -- Assign testagent to Agence Lausanne
    UPDATE public.profiles 
    SET agency_id = agency_lausanne_uuid
    WHERE id = testagent_uuid;

    -- ==========================================================================
    -- OUTPUT: Confirmation
    -- ==========================================================================
    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE 'Agence Lausanne ID: %', agency_lausanne_uuid;
    RAISE NOTICE 'Agence Genève ID: %', agency_geneve_uuid;
    RAISE NOTICE '';
    RAISE NOTICE 'Test accounts:';
    RAISE NOTICE '  - testdev@swissqualif.ch (superuser)';
    RAISE NOTICE '  - testadmin@swissqualif.ch (admin, owns 2 agencies)';
    RAISE NOTICE '  - testagent@swissqualif.ch (agent, assigned to Lausanne)';
END $$;
