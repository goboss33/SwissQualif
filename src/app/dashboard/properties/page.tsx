import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'

export default async function PropertiesPage() {
    const supabase = await createClient()

    const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Biens Immobiliers</h2>
                <Link href="/dashboard/properties/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un bien
                    </Button>
                </Link>
            </div>

            {properties && properties.length > 0 ? (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead>Prix (CHF)</TableHead>
                                <TableHead>Pièces</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {properties.map((property) => (
                                <TableRow key={property.id}>
                                    <TableCell className="font-medium">{property.reference || 'N/A'}</TableCell>
                                    <TableCell>{property.city}</TableCell>
                                    <TableCell>{property.price_chf?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell>{property.rooms}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${property.status === 'active' ? 'bg-green-100 text-green-800' :
                                            property.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {property.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/properties/${property.id}`}>
                                            <Button variant="ghost" size="sm">Modifier</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed bg-white p-8 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Aucun bien trouvé</h3>
                    <p className="mt-2 text-sm text-slate-500 max-w-sm">
                        Vous n'avez pas encore ajouté de biens immobiliers. Commencez par en créer un.
                    </p>
                    <Link href="/dashboard/properties/new" className="mt-6">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter mon premier bien
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
