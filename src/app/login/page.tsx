'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
})

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    async function handleSignUp() {
        const values = form.getValues()
        const isValid = await form.trigger()
        if (!isValid) return

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            alert('Vérifiez votre email pour confirmer l\'inscription')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">SwissQualif</CardTitle>
                    <CardDescription className="text-center">
                        Connectez-vous à votre compte ou créez-en un nouveau
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="nom@exemple.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full" onClick={handleSignUp} disabled={loading}>
                        {loading ? 'Traitement...' : "S'inscrire"}
                    </Button>
                    <p className="text-xs text-center text-slate-500">
                        En continuant, vous acceptez nos conditions d'utilisation.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
