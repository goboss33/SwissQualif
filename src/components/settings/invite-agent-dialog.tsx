'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, Copy, Check } from 'lucide-react'
import { inviteAgentAction } from '@/app/actions/agencies'

export function InviteAgentDialog() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<{
        success: boolean
        message?: string
        invitationUrl?: string
    } | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const response = await inviteAgentAction(email)
            setResult({
                success: response.success,
                message: response.success ? response.message : response.error,
                invitationUrl: response.invitationUrl
            })

            if (response.success && !response.invitationUrl) {
                // Email was sent successfully, close dialog after 2 seconds
                setTimeout(() => {
                    setOpen(false)
                    setEmail('')
                    setResult(null)
                }, 2000)
            }
        })
    }

    const handleCopyUrl = async () => {
        if (result?.invitationUrl) {
            await navigator.clipboard.writeText(result.invitationUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setEmail('')
        setResult(null)
        setCopied(false)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Inviter un Agent
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Inviter un Agent</DialogTitle>
                    <DialogDescription>
                        Envoyez une invitation à un nouvel agent pour rejoindre votre agence.
                    </DialogDescription>
                </DialogHeader>

                {result?.success && result?.invitationUrl ? (
                    // Show invitation URL
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-green-50 p-4 text-green-800 text-sm">
                            <p className="font-medium mb-2">Lien d'invitation créé !</p>
                            <p className="text-xs">Partagez ce lien avec l'agent pour qu'il puisse créer son compte.</p>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={result.invitationUrl}
                                readOnly
                                className="text-xs"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={handleCopyUrl}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="agent@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            {result && !result.success && (
                                <div className="rounded-lg bg-red-50 p-3 text-red-800 text-sm">
                                    {result.message}
                                </div>
                            )}

                            {result?.success && !result.invitationUrl && (
                                <div className="rounded-lg bg-green-50 p-3 text-green-800 text-sm">
                                    {result.message}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isPending || !email}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi...
                                    </>
                                ) : (
                                    'Envoyer l\'invitation'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
