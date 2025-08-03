'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
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
  Eye,
  Edit,
  Send,
  Trash2,
  FileText,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { useInvoices } from '@/hooks/use-invoices'

export default function InvoicesPage() {
  const { invoices, loading, error } = useInvoices()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const stats = {
    total: invoices?.length || 0,
    draft: invoices?.filter((i: any) => i.status === 'DRAFT').length || 0,
    sent: invoices?.filter((i: any) => i.status === 'SENT').length || 0,
    paid: invoices?.filter((i: any) => i.status === 'PAID').length || 0,
    overdue: invoices?.filter((i: any) => i.status === 'OVERDUE').length || 0,
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'default'
      case 'SENT':
        return 'secondary'
      case 'OVERDUE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon'
      case 'SENT':
        return 'Envoyée'
      case 'PAID':
        return 'Payée'
      case 'OVERDUE':
        return 'En retard'
      default:
        return status
    }
  }

  if (loading) return <PageLoading />
  if (error) return <div>Erreur: {error}</div>

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Factures</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez vos factures et suivez vos paiements
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/invoices/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle facture
            </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
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
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Edit className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brouillons</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.draft}</p>
                </div>
              </div>
                </CardContent>
              </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Envoyées</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
                </div>
                  </div>
                </CardContent>
              </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payées</p>
                  <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                </div>
                  </div>
                </CardContent>
              </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En retard</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
                  placeholder="Rechercher une facture..."
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
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="SENT">Envoyée</SelectItem>
                  <SelectItem value="PAID">Payée</SelectItem>
                  <SelectItem value="OVERDUE">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Grid */}
        {filteredInvoices.length === 0 ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <FileText className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune facture trouvée</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucune facture ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première facture.'
                    }
                  </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/invoices/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                    Créer une facture
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInvoices.map((invoice: any) => (
              <Card key={invoice.id} className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 relative z-10">
                  <div className="flex-1">
                    <CardTitle className="text-gray-900 dark:text-white">
                      Facture #{invoice.number || invoice.id}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {invoice.client?.name || 'Client non défini'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Montant</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {invoice.total || 0}€
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Statut</span>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {getStatusLabel(invoice.status || 'DRAFT')}
                      </Badge>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Échéance</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {invoice.createdAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Créée {formatDistanceToNow(new Date(invoice.createdAt), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            )}
      </div>
    </MainLayout>
  )
} 