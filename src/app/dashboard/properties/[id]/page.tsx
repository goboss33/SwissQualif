import { createClient } from '@/lib/supabase/server'
import { PropertyForm } from '@/components/properties/property-form'
import { notFound } from 'next/navigation'

export default async function EditPropertyPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: property, error } = await supabase
        .from('properties')
        .select(`
      *,
      property_images (*)
    `)
        .eq('id', id)
        .single()

    if (error || !property) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Modifier le Bien</h2>
            </div>

            <PropertyForm initialData={property} propertyId={id} />
        </div>
    )
}
