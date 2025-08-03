'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface QuoteItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Quote {
  id: string
  number: string
  title: string
  description?: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  validUntil: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  notes?: string
  acceptedAt?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  clientId: string
  projectId?: string
  
  // Relations
  client: {
    id: string
    name: string
    company?: string
    email?: string
  }
  project?: {
    id: string
    name: string
  }
  items: QuoteItem[]
  emails?: Array<{
    id: string
    subject: string
    status: string
    sentAt?: string
    openedAt?: string
  }>
  
  // Stats
  stats?: {
    itemsCount: number
    emailsCount: number
  }
}

export interface CreateQuoteData {
  title: string
  description?: string
  clientId: string
  projectId?: string
  validUntil: string
  taxRate?: number
  currency?: string
  notes?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
}

export interface UpdateQuoteData {
  title?: string
  description?: string
  status?: Quote['status']
  clientId?: string
  projectId?: string
  validUntil?: string
  taxRate?: number
  currency?: string
  notes?: string
  items?: Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: number
  }>
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Récupérer tous les devis
  const fetchQuotes = useCallback(async (filters?: { status?: string; clientId?: string }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.clientId) params.append('clientId', filters.clientId)

      const response = await fetch(`/api/quotes?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la récupération des devis')
      }

      const data = await response.json()
      setQuotes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer un devis spécifique
  const fetchQuote = useCallback(async (id: string): Promise<Quote | null> => {
    try {
      const response = await fetch(`/api/quotes/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la récupération du devis')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return null
    }
  }, [])

  // Créer un nouveau devis
  const createQuote = useCallback(async (data: CreateQuoteData): Promise<boolean> => {
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du devis')
      }

      const newQuote = await response.json()
      setQuotes(prev => [newQuote, ...prev])
      toast.success('Devis créé avec succès')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return false
    }
  }, [])

  // Mettre à jour un devis
  const updateQuote = useCallback(async (id: string, data: UpdateQuoteData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du devis')
      }

      const updatedQuote = await response.json()
      setQuotes(prev => prev.map(quote => 
        quote.id === id ? updatedQuote : quote
      ))
      toast.success('Devis mis à jour avec succès')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return false
    }
  }, [])

  // Supprimer un devis
  const deleteQuote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du devis')
      }

      setQuotes(prev => prev.filter(quote => quote.id !== id))
      toast.success('Devis supprimé avec succès')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return false
    }
  }, [])

  // Dupliquer un devis
  const duplicateQuote = useCallback(async (id: string, newTitle?: string): Promise<boolean> => {
    try {
      const originalQuote = await fetchQuote(id)
      if (!originalQuote) {
        throw new Error('Devis introuvable')
      }

      // Préparer les données pour la duplication
      const duplicateData: CreateQuoteData = {
        title: newTitle || `Copie de ${originalQuote.title}`,
        description: originalQuote.description,
        clientId: originalQuote.clientId,
        projectId: originalQuote.projectId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        taxRate: originalQuote.taxRate,
        currency: originalQuote.currency,
        notes: originalQuote.notes,
        items: originalQuote.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }

      return await createQuote(duplicateData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return false
    }
  }, [createQuote, fetchQuote])

  // Envoyer un devis par email
  const sendQuote = useCallback(async (id: string): Promise<boolean> => {
    try {
      // TODO: Implémenter l'envoi d'email
      // Pour l'instant, on change juste le statut
      return await updateQuote(id, { status: 'SENT' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      toast.error(errorMessage)
      return false
    }
  }, [updateQuote])

  // Accepter un devis
  const acceptQuote = useCallback(async (id: string): Promise<boolean> => {
    return await updateQuote(id, { status: 'ACCEPTED' })
  }, [updateQuote])

  // Rejeter un devis
  const rejectQuote = useCallback(async (id: string): Promise<boolean> => {
    return await updateQuote(id, { status: 'REJECTED' })
  }, [updateQuote])

  // Charger les devis au montage du composant
  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  return {
    quotes,
    loading,
    error,
    fetchQuotes,
    fetchQuote,
    createQuote,
    updateQuote,
    deleteQuote,
    duplicateQuote,
    sendQuote,
    acceptQuote,
    rejectQuote,
  }
} 