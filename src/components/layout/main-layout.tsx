'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/components/providers/auth-provider'
import { useTheme } from '@/components/providers/theme-provider'
import { AutomationScheduler } from '@/components/automations/automation-scheduler'
import {
  BarChart3,
  Building2,
  Calculator,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  StickyNote,
  Sun,
  Users,
  X,
  Zap,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Vue d\'ensemble de votre activité',
  },
  {
    label: 'Projets',
    href: '/projects',
    icon: FolderOpen,
    description: 'Gérez vos projets et tâches',
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Gérez votre portefeuille client',
  },
  {
    label: 'Factures',
    href: '/invoices',
    icon: CreditCard,
    description: 'Factures et paiements',
  },
  {
    label: 'Templates',
    href: '/templates',
    icon: FileText,
    description: 'Modèles de factures',
  },
  {
    label: 'Devis',
    href: '/quotes',
    icon: Calculator,
    description: 'Créez et gérez vos devis',
  },
  {
    label: 'Suivi du temps',
    href: '/time-tracking',
    icon: Clock,
    description: 'Trackez votre temps de travail',
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: StickyNote,
    description: 'Prenez des notes et organisez vos idées',
  },
  {
    label: 'Planifier',
    href: '/calendar',
    icon: Calendar,
    description: 'Calendrier et planification',
  },
  {
    label: 'Automatisations',
    href: '/automation',
    icon: Zap,
    description: 'Automatisez vos tâches récurrentes',
  },
]

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    if (user.firstName) {
      return `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    }
    return user.email[0].toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 border-r border-blue-200/30 dark:border-slate-700/70 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg shadow-blue-500/8 dark:shadow-slate-900/40',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Aura bleue réduite pour la sidebar */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        
        <div className="flex items-center justify-between p-4 border-b border-blue-200/30 dark:border-slate-700 relative z-10">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-500/30 shadow-lg">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Focalis</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-3 space-y-1 relative z-10">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative overflow-hidden',
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-slate-700/60'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-radial from-blue-400/8 via-transparent to-transparent dark:from-blue-300/8 dark:via-transparent dark:to-transparent" />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-blue-200/30 dark:border-slate-700 relative z-10">
          <Link href="/settings">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-blue-50/30 dark:hover:bg-slate-700/60 transition-colors">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 border-b border-blue-200/30 dark:border-slate-700/70 px-4 py-3 flex items-center shadow-sm shadow-blue-500/8 dark:shadow-slate-900/40">
          {/* Aura bleue réduite pour le header */}
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden relative z-10 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Spacer pour pousser les boutons à droite */}
          <div className="flex-1" />

          <div className="flex items-center space-x-3 relative z-10">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (theme === 'light') {
                  setTheme('dark')
                } else if (theme === 'dark') {
                  setTheme('light')
                } else {
                  // Si theme === 'system', on passe en mode light
                  setTheme('light')
                }
              }}
              className="h-9 w-9 hover:bg-blue-50/30 dark:hover:bg-slate-700/60"
            >
              {!mounted ? (
                <Sun className="h-4 w-4" />
              ) : (
                <>
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    // Pour 'system', on affiche l'icône basée sur la préférence système
                    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )
                  )}
                </>
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-blue-50/30 dark:hover:bg-slate-700/60">
                  <Avatar className="h-8 w-8">
                    {user?.avatar && <AvatarImage src={user.avatar} alt={user?.email} />}
                    <AvatarFallback className="text-sm font-medium bg-blue-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-700/70 shadow-lg shadow-blue-500/8 dark:shadow-slate-900/40" align="end" forceMount>
                {/* Aura bleue réduite pour le dropdown */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                
                <DropdownMenuLabel className="font-normal relative z-10">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-200/30 dark:bg-slate-700" />
                <DropdownMenuItem asChild className="relative z-10">
                  <Link href="/settings" className="hover:bg-blue-50/30 dark:hover:bg-slate-700/60 text-gray-900 dark:text-gray-100">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-200/30 dark:bg-slate-700" />
                <DropdownMenuItem onClick={handleLogout} className="relative z-10 hover:bg-blue-50/30 dark:hover:bg-slate-700/60 text-gray-900 dark:text-gray-100">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Scheduler automatique des automatisations */}
      <AutomationScheduler />
    </div>
  )
} 