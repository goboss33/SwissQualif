'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2 } from 'lucide-react'
import { savePortalConfigAction } from '@/app/actions/settings'

interface PortalFormProps {
    name: string
    slug: string
    config: any
}

export function PortalForm({ name, slug, config }: PortalFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            ftp_host: formData.get('ftp_host') as string,
            ftp_user: formData.get('ftp_user') as string,
            ftp_password: formData.get('ftp_password') as string,
            is_active: formData.get('is_active') === 'on'
        }

        try {
            const result = await savePortalConfigAction(slug, data)
            if (result.success) {
                setMessage({ type: 'success', text: `Configuration ${name} enregistrée.` })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erreur lors de l\'enregistrement.' })
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
                    <div className="flex items-center justify-between">
                        <CardTitle>{name}</CardTitle>
                        <Switch name="is_active" defaultChecked={config.is_active} />
                    </div>
                    <CardDescription>Paramètres de connexion FTP pour {name}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Hôte FTP</Label>
                        <Input name="ftp_host" defaultValue={config.ftp_host || ''} placeholder="ftp.example.ch" />
                    </div>
                    <div className="space-y-2">
                        <Label>Utilisateur FTP</Label>
                        <Input name="ftp_user" defaultValue={config.ftp_user || ''} placeholder="user123" />
                    </div>
                    <div className="space-y-2">
                        <Label>Mot de passe FTP</Label>
                        <Input type="password" name="ftp_password" defaultValue={config.ftp_password || ''} />
                    </div>

                    {message && (
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message.text}
                        </p>
                    )}
                </CardContent>
                <CardContent className="border-t pt-4 flex justify-end">
                    <Button type="submit" size="sm" className="gap-2" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Enregistrer
                    </Button>
                </CardContent>
            </form>
        </Card>
    )
}
