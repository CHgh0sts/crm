import { useState, useEffect } from 'react'

export interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isPublic: boolean
  category: 'BUSINESS' | 'CREATIVE' | 'MINIMAL' | 'PROFESSIONAL' | 'MODERN' | 'CLASSIC'
  layout: any
  elements: any
  styles: any
  variables: any
  thumbnail?: string
  version: string
  createdAt: string
  updatedAt: string
  userId?: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
  }
  _count: {
    invoices: number
  }
}

interface TemplateFilters {
  category?: string
  public?: boolean
  page?: number
  limit?: number
}

interface TemplateResponse {
  templates: InvoiceTemplate[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useInvoiceTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDefaultTemplates, setHasDefaultTemplates] = useState<boolean | null>(null)
  const [initializingDefaults, setInitializingDefaults] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Récupérer la liste des templates
  const fetchTemplates = async (filters: TemplateFilters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.public !== undefined) params.append('public', filters.public.toString())
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/invoice-templates?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des templates')
      }

      const data: TemplateResponse = await response.json()
      setTemplates(data.templates)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Récupérer un template par ID
  const fetchTemplate = async (id: string): Promise<InvoiceTemplate | null> => {
    try {
      const response = await fetch(`/api/invoice-templates/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Erreur lors de la récupération du template')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      return null
    }
  }

  // Créer un nouveau template
  const createTemplate = async (templateData: Partial<InvoiceTemplate>): Promise<boolean> => {
    try {
      const response = await fetch('/api/invoice-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du template')
      }

      const newTemplate = await response.json()
      setTemplates(prev => [newTemplate, ...prev])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      return false
    }
  }

  // Mettre à jour un template
  const updateTemplate = async (id: string, templateData: Partial<InvoiceTemplate>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/invoice-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du template')
      }

      const updatedTemplate = await response.json()
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      return false
    }
  }

  // Supprimer un template
  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/invoice-templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du template')
      }

      setTemplates(prev => prev.filter(template => template.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      return false
    }
  }

  // Dupliquer un template
  const duplicateTemplate = async (id: string, name?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/invoice-templates/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la duplication du template')
      }

      const duplicatedTemplate = await response.json()
      setTemplates(prev => [duplicatedTemplate, ...prev])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      return false
    }
  }

  // Vérifier si les templates par défaut existent
  const checkDefaultTemplates = async () => {
    try {
      const response = await fetch('/api/invoice-templates/seed')
      
      if (response.ok) {
        const data = await response.json()
        setHasDefaultTemplates(data.hasDefaultTemplates)
        return data.hasDefaultTemplates
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des templates:', error)
    }
    return false
  }

  // Initialiser les templates par défaut
  const initializeDefaultTemplates = async () => {
    if (initializingDefaults) return // Éviter les appels multiples
    
    try {
      setInitializingDefaults(true)
      const response = await fetch('/api/invoice-templates/seed', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setHasDefaultTemplates(true)
        // Recharger les templates après initialisation
        await fetchTemplates()
        return data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'initialisation des templates')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'initialisation des templates')
      throw error
    } finally {
      setInitializingDefaults(false)
    }
  }

  // Charger les templates au montage du composant
  useEffect(() => {
    const initializeData = async () => {
      await fetchTemplates()
      // Vérifier les templates par défaut seulement une fois
      if (hasDefaultTemplates === null) {
        await checkDefaultTemplates()
      }
    }
    
    initializeData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    templates,
    loading,
    error,
    pagination,
    hasDefaultTemplates,
    initializingDefaults,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    checkDefaultTemplates,
    initializeDefaultTemplates,
  }
} 