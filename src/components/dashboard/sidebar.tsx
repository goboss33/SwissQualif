'use client'

import Link from 'next/link'
import { Home, Building2, Users, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/properties', label: 'Biens', icon: Building2 },
    { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white transition-transform overflow-y-auto">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-10 px-2 py-2">
                    <h1 className="text-2xl font-bold text-slate-900">SwissQualif</h1>
                </div>
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700 font-medium"
                        >
                            <item.icon className="h-5 w-5 text-slate-500 transition duration-75 group-hover:text-slate-900" />
                            <span className="ml-3">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto border-t pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center rounded-lg p-2 text-slate-700 hover:bg-red-50 hover:text-red-700 font-medium"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="ml-3">Déconnexion</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
