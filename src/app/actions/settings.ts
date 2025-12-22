'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertAgencyAction(name: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id')
            .eq('id', user.id)
            .single()

        if (profile?.agency_id) {
            // Update existing agency
            const { error } = await supabase
                .from('agencies')
                .update({ name })
                .eq('id', profile.agency_id)

            if (error) throw error
        } else {
            // Create new agency
            const { data: agency, error: agencyError } = await supabase
                .from('agencies')
                .insert({ name })
                .select()
                .single()

            if (agencyError) throw agencyError

            // Link to profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ agency_id: agency.id })
                .eq('id', user.id)

            if (profileError) throw profileError
        }

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error: any) {
        console.error('upsertAgencyAction:', error)
        return { success: false, error: error.message || 'Une erreur est survenue' }
    }
}

export async function savePortalConfigAction(portalName: string, config: any) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Non authentifié' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('agency_id')
            .eq('id', user.id)
            .single()

        if (!profile?.agency_id) return { success: false, error: 'Agence requise pour configurer les portails' }

        const { error } = await supabase
            .from('portals_config')
            .upsert({
                agency_id: profile.agency_id,
                portal_name: portalName,
                ...config
            }, { onConflict: 'agency_id, portal_name' })

        if (error) throw error

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error: any) {
        console.error('savePortalConfigAction:', error)
        return { success: false, error: error.message || 'Une erreur est survenue' }
    }
}
