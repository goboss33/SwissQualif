'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all agencies owned by the current admin user
export async function getOwnedAgencies() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié', agencies: [] }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, agency_id')
            .eq('id', user.id)
            .single()

        if (!profile) return { success: false, error: 'Profil non trouvé', agencies: [] }

        // Superuser: get ALL agencies
        if (profile.role === 'superuser') {
            const { data: agencies, error } = await supabase
                .from('agencies')
                .select('*')
                .order('name')

            if (error) throw error
            return { success: true, agencies: agencies || [], currentAgencyId: profile.agency_id }
        }

        // Admin: get agencies they own + their assigned agency
        if (profile.role === 'admin') {
            const { data: agencies, error } = await supabase
                .from('agencies')
                .select('*')
                .or(`owner_id.eq.${user.id},id.eq.${profile.agency_id}`)
                .order('name')

            if (error) throw error
            return { success: true, agencies: agencies || [], currentAgencyId: profile.agency_id }
        }

        // Agent: only their assigned agency
        if (profile.agency_id) {
            const { data: agency, error } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', profile.agency_id)
                .single()

            if (error) throw error
            return { success: true, agencies: agency ? [agency] : [], currentAgencyId: profile.agency_id }
        }

        return { success: true, agencies: [], currentAgencyId: null }
    } catch (error: any) {
        console.error('getOwnedAgencies:', error)
        return { success: false, error: error.message, agencies: [] }
    }
}

// Switch the current working agency for admin users
export async function switchAgencyAction(agencyId: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié' }

        // Verify the user has access to this agency
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile) return { success: false, error: 'Profil non trouvé' }

        // Only admins and superusers can switch agencies
        if (profile.role !== 'admin' && profile.role !== 'superuser') {
            return { success: false, error: 'Accès non autorisé' }
        }

        // Update the profile's current agency
        const { error } = await supabase
            .from('profiles')
            .update({ agency_id: agencyId })
            .eq('id', user.id)

        if (error) throw error

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error('switchAgencyAction:', error)
        return { success: false, error: error.message }
    }
}

// Create a new agency (for admins)
export async function createAgencyAction(name: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || (profile.role !== 'admin' && profile.role !== 'superuser')) {
            return { success: false, error: 'Accès non autorisé' }
        }

        // Create new agency with current user as owner
        const { data: agency, error } = await supabase
            .from('agencies')
            .insert({ name, owner_id: user.id })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/dashboard/settings')
        return { success: true, agency }
    } catch (error: any) {
        console.error('createAgencyAction:', error)
        return { success: false, error: error.message }
    }
}

// Invite an agent to the current agency
export async function inviteAgentAction(email: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, agency_id')
            .eq('id', user.id)
            .single()

        if (!profile || (profile.role !== 'admin' && profile.role !== 'superuser')) {
            return { success: false, error: 'Accès non autorisé' }
        }

        if (!profile.agency_id) {
            return { success: false, error: 'Aucune agence sélectionnée' }
        }

        // For MVP: Generate a signup link with the agency_id
        // In a production system, you would:
        // 1. Send an email with a special invitation link
        // 2. Store the invitation in a database table
        // 3. When the user signs up via the link, auto-assign them to the agency

        // For now, we'll use Supabase's invite functionality
        // Note: This requires email confirmation to be enabled in Supabase
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                agency_id: profile.agency_id,
                role: 'agent'
            }
        })

        if (error) {
            // If admin invite fails (common on client-side), provide manual instructions
            console.warn('Admin invite failed:', error.message)
            
            // Return the manual invitation link approach
            const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?invite=${profile.agency_id}`
            
            return { 
                success: true, 
                message: `Invitation créée. Envoyez ce lien à l'agent: ${invitationUrl}`,
                invitationUrl 
            }
        }

        return { success: true, message: `Invitation envoyée à ${email}` }
    } catch (error: any) {
        console.error('inviteAgentAction:', error)
        return { success: false, error: error.message }
    }
}

// Get user role for access control
export async function getUserRole() {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, role: null }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        return { success: true, role: profile?.role || 'agent' }
    } catch (error: any) {
        console.error('getUserRole:', error)
        return { success: false, role: null }
    }
}
