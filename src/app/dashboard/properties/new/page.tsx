import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/properties/property-form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Building2, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function NewPropertyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user?.id)
        .single()

    if (!profile?.agency_id) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Nouveau Bien</h2>

                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 [&>svg]:text-amber-600">
                    <Building2 className="h-4 w-4" />
                    <AlertTitle>Agence non configurée</AlertTitle>
                    <AlertDescription className="mt-2">
                        Veuillez configurer votre agence dans les **Paramètres** avant d'ajouter un bien immobilier.
                        Ceci est nécessaire pour lier vos biens à votre entité.
                    </AlertDescription>
                    <div className="mt-4">
                        <Link href="/dashboard/settings">
                            <Button variant="outline" className="gap-2 border-amber-200 hover:bg-amber-100">
                                <Settings className="h-4 w-4" /> Aller aux Paramètres
                            </Button>
                        </Link>
                    </div>
                </Alert>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Nouveau Bien</h2>
            </div>

            <PropertyForm />
        </div>
    )
}
