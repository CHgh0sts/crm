'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import { QuoteModal } from '@/components/quotes/quote-modal'
import { useQuotes, Quote } from '@/hooks/use-quotes'
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
  FileText,
  Users,
  DollarSign,
  Mail,
  Calendar,
  Eye,
  Edit,
  Copy,
  Trash2,
  Send,
  Check,
  X,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-500', variant: 'secondary' as const, icon: FileText },
  SENT: { label: 'Envoyé', color: 'bg-blue-500', variant: 'default' as const, icon: Send },
  ACCEPTED: { label: 'Accepté', color: 'bg-green-500', variant: 'default' as const, icon: Check },
  REJECTED: { label: 'Refusé', color: 'bg-red-500', variant: 'destructive' as const, icon: X },
  EXPIRED: { label: 'Expiré', color: 'bg-orange-500', variant: 'destructive' as const, icon: AlertTriangle },
}

function QuoteCard({ quote, onEdit, onDuplicate, onDelete, onSend, onAccept, onReject }: { 
  quote: Quote
  onEdit: (quote: Quote) => void
  onDuplicate: (quote: Quote) => void
  onDelete: (quote: Quote) => void
  onSend: (quote: Quote) => void
  onAccept: (quote: Quote) => void
  onReject: (quote: Quote) => void
}) {
  const statusInfo = statusConfig[quote.status]
  const StatusIcon = statusInfo.icon
  const isExpired = new Date(quote.validUntil) < new Date() && quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED'
  const daysUntilExpiry = Math.ceil((new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant={isExpired ? 'destructive' : statusInfo.variant}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {isExpired ? 'Expiré' : statusInfo.label}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{quote.number}</span>
          </div>
          
          <CardTitle className="text-lg truncate">
            <Link 
              href={`/quotes/${quote.id}`}
              className="hover:text-primary transition-colors"
            >
              {quote.title}
            </Link>
          </CardTitle>
          
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Users className="w-3 h-3 mr-1" />
            <span className="truncate">
              {quote.client.name}
              {quote.client.company && ` (${quote.client.company})`}
            </span>
          </div>
          
          {quote.project && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <FileText className="w-3 h-3 mr-1" />
              <span className="truncate">{quote.project.name}</span>
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/quotes/${quote.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
            {quote.status === 'DRAFT' && (
              <>
                <DropdownMenuItem onClick={() => onEdit(quote)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSend(quote)}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </DropdownMenuItem>
              </>
            )}
            {quote.status === 'SENT' && (
              <>
                <DropdownMenuItem onClick={() => onAccept(quote)}>
                  <Check className="mr-2 h-4 w-4" />
                  Marquer accepté
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReject(quote)}>
                  <X className="mr-2 h-4 w-4" />
                  Marquer refusé
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => onDuplicate(quote)}>
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
                         {(quote.status === 'DRAFT' || quote.status === 'EXPIRED') && (quote.stats?.emailsCount || 0) === 0 && (
              <DropdownMenuItem 
                onClick={() => onDelete(quote)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {quote.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {quote.description}
          </p>
        )}

        {/* Montant et échéance */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {quote.total.toLocaleString()} {quote.currency}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            <span>
              {isExpired ? (
                <span className="text-red-600 font-medium">Expiré</span>
              ) : quote.status === 'ACCEPTED' || quote.status === 'REJECTED' ? (
                `Validité jusqu'au ${new Date(quote.validUntil).toLocaleDateString()}`
              ) : daysUntilExpiry === 0 ? (
                <span className="text-orange-600 font-medium">Expire aujourd'hui</span>
              ) : daysUntilExpiry === 1 ? (
                <span className="text-orange-600 font-medium">Expire demain</span>
              ) : daysUntilExpiry > 0 ? (
                `${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''} restant${daysUntilExpiry > 1 ? 's' : ''}`
              ) : (
                <span className="text-red-600 font-medium">Expiré depuis {Math.abs(daysUntilExpiry)} jour${Math.abs(daysUntilExpiry) > 1 ? 's' : ''}</span>
              )}
            </span>
          </div>
        </div>

        {/* Statistiques et dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {quote.stats?.itemsCount || 0} élément{(quote.stats?.itemsCount || 0) > 1 ? 's' : ''}
            </span>
                         {(quote.stats?.emailsCount || 0) > 0 && (
               <span className="flex items-center">
                 <Mail className="w-3 h-3 mr-1" />
                 {quote.stats?.emailsCount} email{(quote.stats?.emailsCount || 0) > 1 ? 's' : ''}
               </span>
             )}
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>
              {formatDistanceToNow(new Date(quote.createdAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          </div>
        </div>

        {/* Timestamps spéciaux */}
        {quote.acceptedAt && (
          <div className="text-xs text-green-600 font-medium">
            Accepté {formatDistanceToNow(new Date(quote.acceptedAt), { addSuffix: true, locale: fr })}
          </div>
        )}
        {quote.rejectedAt && (
          <div className="text-xs text-red-600 font-medium">
            Refusé {formatDistanceToNow(new Date(quote.rejectedAt), { addSuffix: true, locale: fr })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function QuotesPage() {
  const { quotes, loading, createQuote, updateQuote, deleteQuote, duplicateQuote, sendQuote, acceptQuote, rejectQuote } = useQuotes()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>()

  // Filtrer les devis
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Statistiques calculées
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'DRAFT').length,
    sent: quotes.filter(q => q.status === 'SENT').length,
    accepted: quotes.filter(q => q.status === 'ACCEPTED').length,
    rejected: quotes.filter(q => q.status === 'REJECTED').length,
    expired: quotes.filter(q => {
      const isExpired = new Date(q.validUntil) < new Date()
      return isExpired && q.status !== 'ACCEPTED' && q.status !== 'REJECTED'
    }).length,
    totalValue: quotes.filter(q => q.status === 'ACCEPTED').reduce((sum, q) => sum + q.total, 0),
    pendingValue: quotes.filter(q => q.status === 'SENT').reduce((sum, q) => sum + q.total, 0),
  }

  const handleCreateQuote = async (data: any) => {
    await createQuote(data)
  }

  const handleUpdateQuote = async (data: any) => {
    if (editingQuote) {
      await updateQuote(editingQuote.id, data)
      setEditingQuote(undefined)
    }
  }

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote)
    setQuoteModalOpen(true)
  }

  const handleDuplicateQuote = async (quote: Quote) => {
    await duplicateQuote(quote.id, `Copie de ${quote.title}`)
  }

  const handleDeleteQuote = async (quote: Quote) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le devis "${quote.title}" ?`)) {
      try {
        await deleteQuote(quote.id)
      } catch (error) {
        // L'erreur est déjà gérée dans le hook avec toast
      }
    }
  }

  const handleSendQuote = async (quote: Quote) => {
    if (confirm(`Êtes-vous sûr de vouloir envoyer le devis "${quote.title}" ?`)) {
      await sendQuote(quote.id)
    }
  }

  const handleAcceptQuote = async (quote: Quote) => {
    if (confirm(`Marquer le devis "${quote.title}" comme accepté ?`)) {
      await acceptQuote(quote.id)
    }
  }

  const handleRejectQuote = async (quote: Quote) => {
    if (confirm(`Marquer le devis "${quote.title}" comme refusé ?`)) {
      await rejectQuote(quote.id)
    }
  }

  const handleModalClose = () => {
    setQuoteModalOpen(false)
    setEditingQuote(undefined)
  }

  if (loading) return <PageLoading />

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Créez et gérez vos devis clients
            </p>
          </div>
          <Button 
            onClick={() => setQuoteModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Envoyés</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceptés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                  <X className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Refusés</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
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
                  placeholder="Rechercher un devis..."
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
                  <SelectItem value="SENT">Envoyé</SelectItem>
                  <SelectItem value="ACCEPTED">Accepté</SelectItem>
                  <SelectItem value="REJECTED">Refusé</SelectItem>
                  <SelectItem value="EXPIRED">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Grid */}
        {filteredQuotes.length === 0 ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <FileText className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucun devis trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun devis ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre premier devis pour vos clients.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setQuoteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un devis
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onEdit={handleEditQuote}
                onDuplicate={handleDuplicateQuote}
                onDelete={handleDeleteQuote}
                onSend={handleSendQuote}
                onAccept={handleAcceptQuote}
                onReject={handleRejectQuote}
              />
            ))}
          </div>
        )}

        {/* Modal de création/édition */}
        <QuoteModal
          open={quoteModalOpen}
          onOpenChange={handleModalClose}
          quote={editingQuote}
          onSubmit={editingQuote ? handleUpdateQuote : handleCreateQuote}
        />
      </div>
    </MainLayout>
  )
} 