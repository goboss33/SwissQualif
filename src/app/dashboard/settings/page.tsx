import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-slate-500" />
                        <CardTitle>Configuration de l'Agence</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600">
                        Cet espace permettra prochainement de configurer les informations de votre agence, vos collaborateurs et vos accès aux portails immobiliers.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
