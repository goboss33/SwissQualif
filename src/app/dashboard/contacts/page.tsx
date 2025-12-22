import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function ContactsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-slate-500" />
                        <CardTitle>Gestion des Contacts</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600">
                        Ce module est en cours de développement. Il permettra bientôt de centraliser tous vos prospects et clients pour un suivi optimal.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
