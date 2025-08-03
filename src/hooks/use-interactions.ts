import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface Interaction {
  id: string
  type: 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE' | 'PROPOSAL'
  subject: string
  description?: string
  date: string
  clientId: string
  contactId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInteractionData {
  type: 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE' | 'PROPOSAL'
  subject: string
  description?: string
  date: string
}

export function useInteractions(clientId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInteractions = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/clients/${clientId}/interactions`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des interactions')
      }

      const data = await response.json()
      setInteractions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const createInteraction = useCallback(async (data: CreateInteractionData) => {
    if (!clientId) return null

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/clients/${clientId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de l\'interaction')
      }

      const newInteraction = await response.json()
      setInteractions(prev => [newInteraction, ...prev])
      toast.success('Interaction créée avec succès')
      return newInteraction
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [clientId])

  return {
    interactions,
    loading,
    error,
    fetchInteractions,
    createInteraction,
  }
} 