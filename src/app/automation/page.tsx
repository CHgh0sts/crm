'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoading } from '@/components/ui/loading'
import { AutomationModal } from '@/components/automations/automation-modal'
import { 
  useAutomations, 
  useAutomationExecutions,
  Automation, 
  CreateAutomationData, 
  UpdateAutomationData,
  AUTOMATION_TYPES 
} from '@/hooks/use-automations'
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
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Zap,
  TrendingUp,
  Activity,
  Users,
  AlertCircle,
  Loader2,
  BarChart3,
  Timer,
  MinusCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

// Constantes de couleurs pour les statuts
const STATUS_COLORS = {
  SUCCESS: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: 'text-green-600',
    dot: 'bg-green-500'
  },
  FAILED: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: 'text-red-600',
    dot: 'bg-red-500'
  },
  RUNNING: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'text-blue-600',
    dot: 'bg-blue-500'
  },
  PENDING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'text-yellow-600',
    dot: 'bg-yellow-500'
  },
  CANCELLED: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: 'text-gray-600',
    dot: 'bg-gray-500'
  },
  SKIPPED: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'text-orange-600',
    dot: 'bg-orange-500'
  }
}

const AUTOMATION_STATUS_COLORS = {
  ACTIVE: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800 border-green-200'
  },
  INACTIVE: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export default function AutomationPage() {
  const { automations, loading, createAutomation, updateAutomation, deleteAutomation, executeAutomation, toggleAutomation } = useAutomations()
  const { executions } = useAutomationExecutions()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | undefined>()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtrer les automatisations
  const filteredAutomations = automations.filter(automation => {
    const matchesSearch = automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         automation.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || automation.type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && automation.isActive) ||
                         (statusFilter === 'inactive' && !automation.isActive)
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Statistiques
  const stats = {
    total: automations.length,
    active: automations.filter(a => a.isActive).length,
    inactive: automations.filter(a => !a.isActive).length,
    totalExecutions: automations.reduce((sum, a) => sum + a.totalExecutions, 0),
    successRate: automations.length > 0 
      ? Math.round((automations.reduce((sum, a) => sum + a.successfulExecutions, 0) / 
         Math.max(automations.reduce((sum, a) => sum + a.totalExecutions, 0), 1)) * 100)
      : 0
  }

  const handleCreateAutomation = async (data: CreateAutomationData) => {
    try {
      await createAutomation(data)
      toast.success('🎉 Automatisation créée avec succès !', {
        description: 'Votre nouvelle automatisation est maintenant active.',
      })
    } catch (error) {
      toast.error('❌ Erreur lors de la création', {
        description: 'Impossible de créer l\'automatisation. Veuillez réessayer.',
      })
    }
  }

  const handleUpdateAutomation = async (data: UpdateAutomationData) => {
    if (editingAutomation) {
      try {
        await updateAutomation(editingAutomation.id, data)
        setEditingAutomation(undefined)
        toast.success('✅ Automatisation mise à jour !', {
          description: 'Les modifications ont été sauvegardées.',
        })
      } catch (error) {
        toast.error('❌ Erreur lors de la mise à jour', {
          description: 'Impossible de sauvegarder les modifications.',
        })
      }
    }
  }

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation)
    setAutomationModalOpen(true)
  }

  const handleDeleteAutomation = async (automation: Automation) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'automatisation "${automation.name}" ?`)) {
      try {
        await deleteAutomation(automation.id)
        toast.success('🗑️ Automatisation supprimée', {
          description: `L'automatisation "${automation.name}" a été supprimée.`,
        })
      } catch (error) {
        toast.error('❌ Erreur lors de la suppression', {
          description: 'Impossible de supprimer l\'automatisation.',
        })
      }
    }
  }

  const handleToggleAutomation = async (automation: Automation) => {
    const newStatus = !automation.isActive
    
    // Message spécial pour les automatisations ONCE réactivées
    if (newStatus && automation.scheduleType === 'ONCE' && automation.lastExecutedAt) {
      const confirmMessage = `Voulez-vous réactiver l'automatisation "${automation.name}" ?\n\n⚠️ Cette automatisation de type "ONCE" a déjà été exécutée.\nLa réactiver va :\n• Remettre à zéro l'historique d'exécution\n• Permettre une nouvelle exécution\n• Reprogrammer selon l'heure définie`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }
    
    try {
      await toggleAutomation(automation.id, newStatus)
      if (newStatus) {
        if (automation.scheduleType === 'ONCE' && automation.lastExecutedAt) {
          toast.success('🔄 Automatisation réinitialisée et activée !', {
            description: `"${automation.name}" peut maintenant s'exécuter à nouveau.`,
          })
        } else {
          toast.success('✅ Automatisation activée !', {
            description: `"${automation.name}" est maintenant active.`,
          })
        }
      } else {
        toast.info('⏸️ Automatisation désactivée', {
          description: `"${automation.name}" a été mise en pause.`,
        })
      }
    } catch (error) {
      toast.error('❌ Erreur lors du changement de statut', {
        description: 'Impossible de modifier le statut de l\'automatisation.',
      })
    }
  }

  const handleExecuteAutomation = async (automation: Automation) => {
    if (confirm(`Voulez-vous exécuter maintenant l'automatisation "${automation.name}" ?`)) {
      toast.loading('🚀 Exécution en cours...', {
        description: `Lancement de "${automation.name}"`,
        id: `exec-${automation.id}`
      })
      
      try {
        await executeAutomation(automation.id)
        toast.success('🎯 Exécution réussie !', {
          description: `"${automation.name}" a été exécutée avec succès.`,
          id: `exec-${automation.id}`
        })
      } catch (error) {
        toast.error('💥 Échec de l\'exécution', {
          description: `Erreur lors de l'exécution de "${automation.name}".`,
          id: `exec-${automation.id}`
        })
      }
    }
  }

  const handleSubmit = async (data: CreateAutomationData | UpdateAutomationData) => {
    if (editingAutomation) {
      return await handleUpdateAutomation(data as UpdateAutomationData)
    } else {
      return await handleCreateAutomation(data as CreateAutomationData)
    }
  }

  const handleModalClose = () => {
    setAutomationModalOpen(false)
    setEditingAutomation(undefined)
  }

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (loading) return <PageLoading />

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white">
              <Zap className="h-8 w-8 text-blue-600" />
              <span>Automatisations</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez vos automatisations et planifications de tâches
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={async () => {
                const response = await fetch('/api/automations/scheduler')
                const result = await response.json()
                console.log('Test scheduler:', result)
                toast.info('🔄 Test du scheduler lancé', {
                  description: 'Vérifiez la console pour les détails'
                })
              }}
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 dark:hover:bg-slate-700"
            >
              🔄 Test Scheduler
            </Button>
            <Button onClick={() => setAutomationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle automatisation
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
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
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actives</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Pause className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactives</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exécutions</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalExecutions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de réussite</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher une automatisation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[200px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {AUTOMATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="inactive">Inactives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue="automations" className="space-y-4">
          <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-200/30 dark:border-slate-600/50">
            <TabsTrigger value="automations">Automatisations</TabsTrigger>
            <TabsTrigger value="executions">Historique d'exécution</TabsTrigger>
          </TabsList>

          <TabsContent value="automations">
            {/* Liste des automatisations */}
            {filteredAutomations.length === 0 ? (
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
                  <Zap className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune automatisation trouvée</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Aucune automatisation ne correspond à vos critères.'
                      : 'Commencez par créer votre première automatisation pour gagner du temps.'
                    }
                  </p>
                  {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                    <Button onClick={() => setAutomationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une automatisation
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAutomations.map((automation) => (
                  <AutomationCard
                    key={automation.id}
                    automation={automation}
                    onEdit={handleEditAutomation}
                    onDelete={handleDeleteAutomation}
                    onToggle={handleToggleAutomation}
                    onExecute={handleExecuteAutomation}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="executions">
            <ExecutionHistoryTable executions={executions} />
          </TabsContent>
        </Tabs>

        {/* Modal de création/édition */}
        <AutomationModal
          open={automationModalOpen}
          onOpenChange={handleModalClose}
          automation={editingAutomation}
          onSubmit={handleSubmit}
        />
      </div>
    </MainLayout>
  )
}

// Composant carte d'automatisation
function AutomationCard({ 
  automation, 
  onEdit, 
  onDelete, 
  onToggle, 
  onExecute 
}: {
  automation: Automation
  onEdit: (automation: Automation) => void
  onDelete: (automation: Automation) => void
  onToggle: (automation: Automation) => void
  onExecute: (automation: Automation) => void
}) {
  const typeInfo = AUTOMATION_TYPES.find(t => t.value === automation.type)
  const successRate = automation.totalExecutions > 0 
    ? Math.round((automation.successfulExecutions / automation.totalExecutions) * 100)
    : 0

  const statusColors = automation.isActive ? AUTOMATION_STATUS_COLORS.ACTIVE : AUTOMATION_STATUS_COLORS.INACTIVE

  return (
    <Card className={`${statusColors.border} hover:shadow-md transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50`}>
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: typeInfo?.color || '#6B7280' }}
            >
              {typeInfo?.icon || '⚙️'}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1 text-gray-900 dark:text-white">{automation.name}</CardTitle>
              <CardDescription className="line-clamp-1 text-gray-600 dark:text-gray-400">
                {automation.description || typeInfo?.label}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${automation.isActive ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
              <Badge className={`${statusColors.badge} border font-medium`}>
                {automation.isActive ? (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Active</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3" />
                    <span>Inactive</span>
                  </div>
                )}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative z-10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExecute(automation)}>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter maintenant
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(automation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(automation)}>
                  {automation.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(automation)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 relative z-10">
        {/* Planification */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <Clock className="h-4 w-4" />
          <span>
            {automation.scheduleType === 'DAILY' && automation.scheduleTime && `Tous les jours à ${automation.scheduleTime}`}
            {automation.scheduleType === 'WEEKLY' && automation.scheduleTime && `Chaque semaine à ${automation.scheduleTime}`}
            {automation.scheduleType === 'MONTHLY' && automation.scheduleTime && automation.scheduleDayOfMonth && 
             `Le ${automation.scheduleDayOfMonth} de chaque mois à ${automation.scheduleTime}`}
            {automation.scheduleType === 'ONCE' && 'Une seule fois'}
            {automation.scheduleType === 'INTERVAL' && automation.scheduleInterval && 
             `Toutes les ${automation.scheduleInterval} minutes`}
          </span>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{automation.totalExecutions}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Exécutions</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              successRate >= 90 ? 'text-green-600' :
              successRate >= 70 ? 'text-yellow-600' :
              successRate >= 50 ? 'text-orange-600' :
              automation.totalExecutions > 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {successRate}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Réussite</div>
          </div>
        </div>

        {/* Barre de progression de réussite */}
        {automation.totalExecutions > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Taux de réussite</span>
              <span className={`font-medium ${
                successRate >= 90 ? 'text-green-600' :
                successRate >= 70 ? 'text-yellow-600' :
                successRate >= 50 ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {successRate}%
              </span>
            </div>
            <Progress 
              value={successRate} 
              className={`h-2 ${
                successRate >= 90 ? '[&>div]:bg-green-500' :
                successRate >= 70 ? '[&>div]:bg-yellow-500' :
                successRate >= 50 ? '[&>div]:bg-orange-500' :
                '[&>div]:bg-red-500'
              }`} 
            />
          </div>
        )}

        {/* Prochaine exécution */}
        {automation.nextExecutionAt && automation.isActive && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 inline mr-1" />
            Prochaine: {formatDistanceToNow(new Date(automation.nextExecutionAt), { 
              addSuffix: true, 
              locale: fr 
            })}
          </div>
        )}

        {/* Dernière exécution */}
        {automation.lastExecutedAt && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <Timer className="h-4 w-4 inline mr-1" />
            Dernière: {formatDistanceToNow(new Date(automation.lastExecutedAt), { 
              addSuffix: true, 
              locale: fr 
            })}
          </div>
        )}

        {/* Destinataires */}
        {automation.recipients.length > 0 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4 inline mr-1" />
            {automation.recipients.length} destinataire{automation.recipients.length > 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Composant tableau d'historique d'exécution
function ExecutionHistoryTable({ executions }: { executions: any[] }) {
  if (executions.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
          <BarChart3 className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune exécution trouvée</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            L'historique des exécutions d'automatisations apparaîtra ici.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-gray-900 dark:text-white">Historique d'exécution</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Dernières exécutions d'automatisations
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4">
          {executions.map((execution) => {
            const statusColor = STATUS_COLORS[execution.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.PENDING
            const StatusIcon = execution.status === 'SUCCESS' ? CheckCircle :
                              execution.status === 'FAILED' ? XCircle :
                              execution.status === 'RUNNING' ? Loader2 :
                              execution.status === 'CANCELLED' ? XCircle :
                              execution.status === 'SKIPPED' ? AlertCircle :
                              AlertCircle

            return (
              <div key={execution.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${statusColor.border} ${statusColor.bg} border-blue-200/30 dark:border-slate-600/50`}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor.dot} ${execution.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                    <StatusIcon className={`h-5 w-5 ${statusColor.icon} ${execution.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{execution.automation?.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {execution.automation?.type}
                    </div>
                    {execution.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                        Erreur: {execution.error}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={`${statusColor.badge} border font-medium`}>
                    <div className="flex items-center space-x-1">
                      <StatusIcon className={`h-3 w-3 ${execution.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                      <span>
                        {execution.status === 'SUCCESS' ? 'Réussi' :
                         execution.status === 'FAILED' ? 'Échec' :
                         execution.status === 'RUNNING' ? 'En cours' :
                         execution.status === 'CANCELLED' ? 'Annulé' :
                         execution.status === 'SKIPPED' ? 'Ignoré' :
                         'En attente'}
                      </span>
                    </div>
                  </Badge>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(execution.startedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </div>
                  
                  {execution.duration && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                      {execution.duration}ms
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 