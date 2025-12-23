'use client'

import { useEffect, useState, useTransition } from 'react'
import { Building2, ChevronDown, Loader2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getOwnedAgencies, switchAgencyAction } from '@/app/actions/agencies'

interface Agency {
    id: string
    name: string
}

export function AgencySwitcher() {
    const [agencies, setAgencies] = useState<Agency[]>([])
    const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadAgencies() {
            const result = await getOwnedAgencies()
            if (result.success) {
                setAgencies(result.agencies)
                setCurrentAgencyId(result.currentAgencyId)
            }
            setIsLoading(false)
        }
        loadAgencies()
    }, [])

    const handleAgencyChange = (agencyId: string) => {
        startTransition(async () => {
            const result = await switchAgencyAction(agencyId)
            if (result.success) {
                setCurrentAgencyId(agencyId)
                // Refresh the page to reload data for new agency
                window.location.reload()
            }
        })
    }

    // Don't show if only one agency or no agencies
    if (isLoading) {
        return (
            <div className="px-2 py-3 mb-4 border-b">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Chargement...</span>
                </div>
            </div>
        )
    }

    if (agencies.length <= 1) {
        // Show current agency name without switcher
        const currentAgency = agencies[0]
        if (!currentAgency) return null

        return (
            <div className="px-2 py-3 mb-4 border-b">
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700 truncate">
                        {currentAgency.name}
                    </span>
                </div>
            </div>
        )
    }

    const currentAgency = agencies.find(a => a.id === currentAgencyId)

    return (
        <div className="px-2 py-3 mb-4 border-b">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
                Agence active
            </label>
            <Select
                value={currentAgencyId || undefined}
                onValueChange={handleAgencyChange}
                disabled={isPending}
            >
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Building2 className="h-4 w-4" />
                        )}
                        <SelectValue placeholder="Sélectionner une agence">
                            {currentAgency?.name || 'Sélectionner...'}
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{agency.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
