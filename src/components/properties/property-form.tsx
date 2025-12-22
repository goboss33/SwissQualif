'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Loader2 } from 'lucide-react'

const propertySchema = z.object({
    reference: z.string().min(1, 'Référence requise'),
    price_chf: z.coerce.number().min(0, 'Prix invalide'),
    street: z.string().min(1, 'Rue requise'),
    zip_code: z.string().min(1, 'NPA requis'),
    city: z.string().min(1, 'Ville requise'),
    canton: z.string().min(1, 'Canton requis'),
    rooms: z.coerce.number().min(0.5, 'Nombre de pièces invalide'),
    surface_living: z.coerce.number().min(1, 'Surface habitable requise'),
    description_fr: z.string().optional(),
})

type PropertyFormProps = {
    initialData?: any
    propertyId?: string
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function PropertyForm({ initialData, propertyId }: PropertyFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const supabase = createClient()

    const form = useForm<z.infer<typeof propertySchema>>({
        resolver: zodResolver(propertySchema),
        defaultValues: initialData ? {
            reference: initialData.reference || '',
            price_chf: initialData.price_chf || 0,
            street: initialData.street || '',
            zip_code: initialData.zip_code || '',
            city: initialData.city || '',
            canton: initialData.canton || '',
            rooms: initialData.rooms || 3.5,
            surface_living: initialData.surface_living || 0,
            description_fr: initialData.description_fr || '',
        } : {
            reference: '',
            price_chf: 0,
            street: '',
            zip_code: '',
            city: '',
            canton: '',
            rooms: 3.5,
            surface_living: 0,
            description_fr: '',
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)

            // Image size validation
            for (const file of newFiles) {
                if (file.size > MAX_SIZE) {
                    alert(`L'image "${file.name}" est trop lourde (Max 5MB)`)
                    return
                }
            }

            if (files.length + newFiles.length > 3) {
                alert('Maximum 3 photos autorisées')
                return
            }
            setFiles([...files, ...newFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    async function onSubmit(values: z.infer<typeof propertySchema>) {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Utilisateur non connecté')

            const { data: profile } = await supabase
                .from('profiles')
                .select('agency_id')
                .eq('id', user.id)
                .single()

            if (!profile?.agency_id) throw new Error('Agence non trouvée')

            let currentPropertyId = propertyId

            if (propertyId) {
                // Update
                const { error: updateError } = await supabase
                    .from('properties')
                    .update(values)
                    .eq('id', propertyId)

                if (updateError) throw updateError
            } else {
                // Create
                const { data: property, error: propertyError } = await supabase
                    .from('properties')
                    .insert({
                        ...values,
                        agency_id: profile.agency_id,
                        status: 'draft'
                    })
                    .select()
                    .single()

                if (propertyError) throw propertyError
                currentPropertyId = property.id
            }

            // Upload new images if any
            if (currentPropertyId && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const fileExt = file.name.split('.').pop()
                    const filePath = `${currentPropertyId}/${Date.now()}-${i}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('properties')
                        .upload(filePath, file)

                    if (uploadError) throw uploadError

                    await supabase
                        .from('property_images')
                        .insert({
                            property_id: currentPropertyId,
                            storage_path: filePath,
                            position: i
                        })
                }
            }

            router.push('/dashboard/properties')
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations Générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Référence</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: VILLA-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price_chf"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prix (CHF)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pièces</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="surface_living"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Surface (m²)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Adresse</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="street"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rue et N°</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Grand-Rue 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="zip_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NPA</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ville</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Lausanne" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="canton"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Canton</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Vaud" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Description & Photos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="description_fr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (FR)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Description détaillée du bien..."
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <Label>Photos (Max 3 - Nouvelles)</Label>
                            <div className="grid grid-cols-3 gap-4">
                                {files.map((file, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg border bg-slate-100 overflow-hidden">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:bg-red-50"
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                                {files.length < 3 && (
                                    <label className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition">
                                        <Upload className="h-8 w-8 text-slate-400" />
                                        <span className="mt-2 text-xs font-medium text-slate-500">Ajouter</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                            {initialData?.property_images?.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2">
                                    Note: Les nouvelles photos seront ajoutées à celles existantes.
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-4 border-t px-6 py-4">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Annuler</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {propertyId ? 'Mettre à jour le bien' : 'Sauvegarder le bien'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}
