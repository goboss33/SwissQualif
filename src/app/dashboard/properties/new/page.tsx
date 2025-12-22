'use client'

import { PropertyForm } from '@/components/properties/property-form'

export default function NewPropertyPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Nouveau Bien</h2>
            </div>

            <PropertyForm />
        </div>
    )
}
