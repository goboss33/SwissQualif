import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Globe, Users } from 'lucide-react'
import { AgencyForm } from '@/components/settings/agency-form'
import { PortalForm } from '@/components/settings/portal-form'
import { InviteAgentDialog } from '@/components/settings/invite-agent-dialog'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Fetch Current User & Profile
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, agencies(*)')
        .eq('id', user?.id)
        .single()

    // Access control: Only admin and superuser can access settings
    if (profile?.role === 'agent') {
        redirect('/dashboard')
    }

    // Fetch Portal Configs
    const { data: portals } = await supabase
        .from('portals_config')
        .select('*')
        .eq('agency_id', profile?.agency_id || '00000000-0000-0000-0000-000000000000')

    // Fetch agents in current agency (for admin view)
    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('agency_id', profile?.agency_id)
        .neq('id', user?.id)
        .order('created_at', { ascending: false })

    const homegateConfig = portals?.find(p => p.portal_name === 'homegate') || {}
    const immoscoutConfig = portals?.find(p => p.portal_name === 'immoscout24') || {}

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
                <p className="text-slate-500">Gérez votre agence, votre équipe et vos connexions aux portails immobiliers.</p>
            </div>

            <Tabs defaultValue="agency" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="agency" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Agence
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Équipe
                    </TabsTrigger>
                    <TabsTrigger value="multidiffusion" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Multidiffusion
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agency">
                    <AgencyForm initialName={profile?.agencies?.name || ''} />
                </TabsContent>

                <TabsContent value="team">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Gestion de l'équipe</CardTitle>
                                <CardDescription>
                                    Invitez des agents à rejoindre votre agence et gérez leurs accès.
                                </CardDescription>
                            </div>
                            <InviteAgentDialog />
                        </CardHeader>
                        <CardContent>
                            {agents && agents.length > 0 ? (
                                <div className="divide-y">
                                    {agents.map((agent) => (
                                        <div key={agent.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="font-medium">{agent.full_name || 'Agent sans nom'}</p>
                                                <p className="text-sm text-slate-500 capitalize">{agent.role}</p>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                Membre depuis {new Date(agent.created_at).toLocaleDateString('fr-CH')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                    <p>Aucun agent dans cette agence pour le moment.</p>
                                    <p className="text-sm mt-1">Utilisez le bouton "Inviter un Agent" pour ajouter des membres.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
