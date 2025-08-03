'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import { ClientModal } from '@/components/clients/client-modal'
import { useClients, Client } from '@/hooks/use-clients'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Building2,
  Users,
  DollarSign,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusConfig = {
  ACTIVE: { label: 'Actif', color: 'bg-green-500', variant: 'default' as const },
  INACTIVE: { label: 'Inactif', color: 'bg-gray-500', variant: 'secondary' as const },
  PROSPECT: { label: 'Prospect', color: 'bg-blue-500', variant: 'default' as const },
}

function ClientCard({ client, onEdit, onDelete }: { 
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}) {
  const router = useRouter()
  const totalRevenue = client.stats?.totalRevenue || 0
  const projectsCount = client.stats?.projectsCount || 0

  const handleCardClick = (e: React.MouseEvent) => {
    // Ne pas naviguer si on clique sur le menu dropdown ou ses éléments
    const target = e.target as HTMLElement
    if (target.closest('[data-radix-popper-content-wrapper]') || 
        target.closest('button') || 
        target.closest('[role="menuitem"]')) {
      return
    }
    router.push(`/clients/${client.id}`)
  }

  return (
    <Card 
      className="group hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">
            {client.name}
          </CardTitle>
          {client.company && (
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Building2 className="w-3 h-3 mr-1" />
              {client.company}
            </p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/clients/${client.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(client)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statut et informations de contact */}
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig[client.status].variant}>
            {statusConfig[client.status].label}
          </Badge>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {client.email && (
              <Mail className="w-3 h-3" />
            )}
            {client.phone && (
              <Phone className="w-3 h-3" />
            )}
            {client.website && (
              <Globe className="w-3 h-3" />
            )}
          </div>
        </div>

        {/* Informations de contact principales */}
        <div className="space-y-2 text-sm">
          {client.email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="w-3 h-3 mr-2" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="w-3 h-3 mr-2" />
              <span>{client.phone}</span>
            </div>
          )}
          {(client.city || client.country) && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-3 h-3 mr-2" />
              <span>
                {[client.city, client.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">
                {totalRevenue.toLocaleString()} €
              </div>
              <div className="text-xs text-muted-foreground">Chiffre d'affaires</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{projectsCount}</div>
              <div className="text-xs text-muted-foreground">
                Projet{projectsCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Dernière mise à jour */}
        <div className="text-xs text-muted-foreground text-center">
          Mis à jour {formatDistanceToNow(new Date(client.updatedAt), { 
            addSuffix: true, 
            locale: fr 
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientsPage() {
  const { clients, loading, error } = useClients()
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredClients = clients?.filter((client: Client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter((c: Client) => c.status === 'ACTIVE').length || 0,
    prospects: clients?.filter((c: Client) => c.status === 'PROSPECT').length || 0,
    inactive: clients?.filter((c: Client) => c.status === 'INACTIVE').length || 0,
  }

  const handleCreateClient = () => {
    setEditingClient(undefined)
    setClientModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setClientModalOpen(true)
  }

  const handleModalClose = () => {
    setClientModalOpen(false)
    setEditingClient(undefined)
  }

  const handleDeleteClient = (client: Client) => {
    // Implémentation de la suppression
    console.log('Delete client:', client.id)
  }

  if (loading) return <PageLoading />
  if (error) return <div>Erreur: {error}</div>

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez vos clients et prospects
            </p>
          </div>
          <Button 
            onClick={handleCreateClient}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prospects</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.prospects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <UserX className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactifs</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <Users className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucun client trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucun client ne correspond à vos critères de recherche.'
                  : 'Commencez par ajouter votre premier client.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={handleCreateClient} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client: Client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            ))}
          </div>
        )}

        {/* Modal de création/édition */}
        <ClientModal
          open={clientModalOpen}
          onOpenChange={handleModalClose}
          client={editingClient}
          onSubmit={async (data) => {
            // Implémentation de la création/édition
            console.log('Client data:', data)
            handleModalClose()
          }}
        />
      </div>
    </MainLayout>
  )
} 