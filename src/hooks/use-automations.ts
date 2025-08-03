import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export interface AutomationRecipient {
  id: string
  email: string
  name?: string
  recipientType: 'CUSTOM' | 'CLIENT' | 'TEAM' | 'PROJECT_MEMBERS'
}

export interface AutomationExecution {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  startedAt: string
  completedAt?: string
  error?: string
  result?: unknown
  automation?: {
    id: string
    name: string
    type: string
  }
}

export interface Automation {
  id: string
  name: string
  description?: string
  type: 'EMAIL_REMINDER' | 'TASK_CREATION' | 'STATUS_UPDATE' | 'REPORT_GENERATION' | 
        'CLIENT_FOLLOW_UP' | 'INVOICE_REMINDER' | 'BACKUP_DATA' | 'NOTIFICATION_SEND' |
        'PROJECT_ARCHIVE' | 'CLIENT_CHECK_IN' | 'DEADLINE_ALERT' | 'WEEKLY_SUMMARY'
  isActive: boolean
  scheduleType: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'INTERVAL' | 'CUSTOM_CRON'
  scheduleTime?: string
  scheduleDayOfMonth?: number
  scheduleDayOfWeek?: number
  scheduleInterval?: number
  customCronExpression?: string
  config: Record<string, unknown>
  conditions?: Record<string, unknown>
  recipients: AutomationRecipient[]
  executions: AutomationExecution[]
  totalExecutions: number
  successfulExecutions: number
  lastExecutedAt?: string
  nextExecutionAt?: string
  createdAt: string
  updatedAt: string
  _count?: {
    executions: number
  }
}

export interface CreateAutomationData {
  name: string
  description?: string
  type: Automation['type']
  isActive?: boolean
  scheduleType: Automation['scheduleType']
  scheduleTime?: string
  scheduleDayOfMonth?: number
  scheduleDayOfWeek?: number
  scheduleInterval?: number
  customCronExpression?: string
  config: Record<string, unknown>
  conditions?: Record<string, unknown>
  recipients?: Omit<AutomationRecipient, 'id'>[]
}

export type UpdateAutomationData = Partial<CreateAutomationData>

export interface AutomationsFilters {
  type?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface AutomationsPagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export function useAutomations(filters: AutomationsFilters = {}) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [pagination, setPagination] = useState<AutomationsPagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    return params.toString()
  }, [filters.type, filters.isActive, filters.page, filters.limit])

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations${queryString ? `?${queryString}` : ''}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des automatisations')
      }

      const data = await response.json()
      setAutomations(data.automations)
      setPagination(data.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  const createAutomation = useCallback(async (data: CreateAutomationData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      const automation = await response.json()
      setAutomations(prev => [automation, ...prev])
      toast.success('Automatisation créée avec succès')
      return automation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAutomation = useCallback(async (id: string, data: UpdateAutomationData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      const automation = await response.json()
      setAutomations(prev => 
        prev.map(a => a.id === id ? automation : a)
      )
      toast.success('Automatisation mise à jour avec succès')
      return automation
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAutomation = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      setAutomations(prev => prev.filter(a => a.id !== id))
      toast.success('Automatisation supprimée avec succès')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const executeAutomation = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations/${id}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'exécution')
      }

      const result = await response.json()
      
      // Rafraîchir les données après exécution
      await fetchAutomations()
      
      toast.success('Automatisation exécutée avec succès')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'exécution'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchAutomations])

  const toggleAutomation = useCallback(async (id: string, isActive: boolean) => {
    return await updateAutomation(id, { isActive })
  }, [updateAutomation])

  useEffect(() => {
    fetchAutomations()
  }, [fetchAutomations])

  return {
    automations,
    pagination,
    loading,
    error,
    refetch: fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    executeAutomation,
    toggleAutomation,
  }
}

export function useAutomation(id: string) {
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAutomation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'automatisation')
      }

      const data = await response.json()
      setAutomation(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchAutomation()
    }
  }, [id, fetchAutomation])

  return {
    automation,
    loading,
    error,
    refetch: fetchAutomation,
  }
}

export function useAutomationExecutions(filters: { automationId?: string; status?: string } = {}) {
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [pagination, setPagination] = useState<AutomationsPagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.automationId) params.append('automationId', filters.automationId)
    if (filters.status) params.append('status', filters.status)

    return params.toString()
  }, [filters.automationId, filters.status])

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/automations/executions${queryString ? `?${queryString}` : ''}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'historique')
      }

      const data = await response.json()
      setExecutions(data.executions)
      setPagination(data.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  return {
    executions,
    pagination,
    loading,
    error,
    refetch: fetchExecutions,
  }
}

// Types d'automatisation avec métadonnées
export const AUTOMATION_TYPES = [
  {
    value: 'EMAIL_REMINDER',
    label: 'Email conditionnel',
    description: 'Envoyer un email selon des conditions spécifiques (pas de réponse, échéance, etc.)',
    icon: '📧',
    color: '#3B82F6'
  },
  {
    value: 'TASK_CREATION',
    label: 'Création de tâches',
    description: 'Créer automatiquement des tâches selon des critères',
    icon: '✅',
    color: '#10B981'
  },
  {
    value: 'STATUS_UPDATE',
    label: 'Mise à jour de statuts',
    description: 'Mettre à jour automatiquement les statuts des projets/tâches',
    icon: '🔄',
    color: '#F59E0B'
  },
  {
    value: 'REPORT_GENERATION',
    label: 'Génération de rapports',
    description: 'Générer des rapports automatiquement',
    icon: '📊',
    color: '#8B5CF6'
  },
  {
    value: 'CLIENT_FOLLOW_UP',
    label: 'Suivi client',
    description: 'Effectuer un suivi automatique des clients',
    icon: '👥',
    color: '#EC4899'
  },
  {
    value: 'INVOICE_REMINDER',
    label: 'Rappel de facture',
    description: 'Envoyer des rappels pour les factures impayées',
    icon: '💰',
    color: '#EF4444'
  },
  {
    value: 'BACKUP_DATA',
    label: 'Sauvegarde de données',
    description: 'Effectuer des sauvegardes automatiques',
    icon: '💾',
    color: '#6B7280'
  },
  {
    value: 'NOTIFICATION_SEND',
    label: 'Envoi de notifications',
    description: 'Envoyer des notifications personnalisées',
    icon: '🔔',
    color: '#F97316'
  },
  {
    value: 'PROJECT_ARCHIVE',
    label: 'Archivage de projets',
    description: 'Archiver automatiquement les projets terminés',
    icon: '📁',
    color: '#84CC16'
  },
  {
    value: 'CLIENT_CHECK_IN',
    label: 'Vérification client',
    description: 'Vérifier régulièrement l\'état des clients',
    icon: '🔍',
    color: '#06B6D4'
  },
  {
    value: 'DEADLINE_ALERT',
    label: 'Alerte d\'échéances',
    description: 'Alerter avant les dates d\'échéance importantes',
    icon: '⏰',
    color: '#DC2626'
  },
  {
    value: 'WEEKLY_SUMMARY',
    label: 'Résumé hebdomadaire',
    description: 'Générer un résumé hebdomadaire des activités',
    icon: '📋',
    color: '#7C3AED'
  }
] as const

export const SCHEDULE_TYPES = [
  { value: 'ONCE', label: 'Une seule fois', description: 'Exécuter une seule fois à une date/heure spécifique' },
  { value: 'DAILY', label: 'Quotidien', description: 'Exécuter tous les jours à une heure fixe' },
  { value: 'WEEKLY', label: 'Hebdomadaire', description: 'Exécuter chaque semaine à un jour et heure spécifiques' },
  { value: 'MONTHLY', label: 'Mensuel', description: 'Exécuter chaque mois à un jour et heure spécifiques' },
  { value: 'YEARLY', label: 'Annuel', description: 'Exécuter chaque année à une date spécifique' },
  { value: 'INTERVAL', label: 'Intervalle', description: 'Exécuter à intervalles réguliers (minutes/heures)' },
  { value: 'CUSTOM_CRON', label: 'Expression Cron', description: 'Utiliser une expression cron personnalisée' }
] as const

export const RECIPIENT_TYPES = [
  { value: 'CUSTOM', label: 'Emails personnalisés', description: 'Liste d\'emails spécifiques' },
  { value: 'CLIENT', label: 'Tous les clients', description: 'Envoyer à tous les clients actifs' },
  { value: 'TEAM', label: 'Équipe interne', description: 'Envoyer à l\'équipe interne' },
  { value: 'PROJECT_MEMBERS', label: 'Membres du projet', description: 'Envoyer aux membres d\'un projet spécifique' }
] as const 