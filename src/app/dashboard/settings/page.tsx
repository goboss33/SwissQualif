import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Globe } from 'lucide-react'
import { AgencyForm } from '@/components/settings/agency-form'
import { PortalForm } from '@/components/settings/portal-form'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Fetch Current User & Profile
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, agencies(*)')
        .eq('id', user?.id)
        .single()

    // Fetch Portal Configs
    const { data: portals } = await supabase
        .from('portals_config')
        .select('*')
        .eq('agency_id', profile?.agency_id || '00000000-0000-0000-0000-000000000000')

    const homegateConfig = portals?.find(p => p.portal_name === 'homegate') || {}
    const immoscoutConfig = portals?.find(p => p.portal_name === 'immoscout24') || {}

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
                <p className="text-slate-500">Gérez votre agence et vos connexions aux portails immobiliers.</p>
            </div>

            <Tabs defaultValue="agency" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="agency" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Agence
                    </TabsTrigger>
                    <TabsTrigger value="multidiffusion" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Multidiffusion
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agency">
                    <AgencyForm initialName={profile?.agencies?.name || ''} />
                </TabsContent>

                <TabsContent value="multidiffusion">
                    <div className="grid gap-6 md:grid-cols-2">
                        <PortalForm
                            name="Homegate"
                            slug="homegate"
                            config={homegateConfig}
                        />
                        <PortalForm
                            name="ImmoScout24"
                            slug="immoscout24"
                            config={immoscoutConfig}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
