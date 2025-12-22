'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'
import { upsertAgencyAction } from '@/app/actions/settings'

interface AgencyFormProps {
    initialName: string
}

export function AgencyForm({ initialName }: AgencyFormProps) {
    const [name, setName] = useState(initialName)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const result = await upsertAgencyAction(name)
            if (result.success) {
                setMessage({ type: 'success', text: 'Identité de l\'agence sauvegardée avec succès.' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Une erreur inattendue est survenue.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Identité de l'agence</CardTitle>
                    <CardDescription>Informations générales de votre entité immobilière.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de l'agence</Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom de votre agence"
                            required
                        />
                    </div>

                    {message && (
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message.text}
                        </p>
                    )}
                </CardContent>
                <CardContent className="border-t pt-4 flex justify-end">
                    <Button type="submit" className="gap-2" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Sauvegarder
                    </Button>
                </CardContent>
            </form>
        </Card>
    )
}
