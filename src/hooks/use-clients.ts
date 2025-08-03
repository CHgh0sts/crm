'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Client {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  website?: string
  notes?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'
  createdAt: Date
  updatedAt: Date
  contacts?: Contact[]
  interactions?: Interaction[]
  projects?: Array<{
    id: string
    name: string
    status: string
    priority: string
    color: string
    progress: number
  }>
  invoices?: Array<{
    id: string
    number: string
    title: string
    status: string
    total: number
    issueDate: Date
    dueDate: Date
    paidDate?: Date
  }>
  quotes?: Array<{
    id: string
    number: string
    title: string
    status: string
    total: number
    validUntil: Date
  }>
  stats?: {
    totalRevenue: number
    contactsCount: number
    interactionsCount: number
    projectsCount: number
    invoicesCount: number
    quotesCount: number
    paidInvoices?: number
    overdueInvoices?: number
    lastInteraction?: Date | null
    primaryContact?: Contact | null
  }
}

export interface Contact {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  position?: string
  notes?: string
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Interaction {
  id: string
  type: 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE' | 'PROPOSAL'
  subject: string
  description?: string
  date: Date
  createdAt: Date
  updatedAt: Date
  contact?: {
    id: string
    firstName: string
    lastName?: string
  }
}

export interface CreateClientData {
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  website?: string
  notes?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async (params?: {
    status?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/clients?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des clients')
      }

      const data = await response.json()
      setClients(data.clients)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (clientData: CreateClientData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du client')
      }

      const newClient = await response.json()
      setClients(prev => [newClient, ...prev])
      toast.success('Client créé avec succès')
      return newClient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du client'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateClient = async (id: string, clientData: UpdateClientData) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du client')
      }

      const updatedClient = await response.json()
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c))
      toast.success('Client mis à jour avec succès')
      return updatedClient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du client'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du client')
      }

      const result = await response.json()
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success(result.message || 'Client supprimé avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du client'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    refetch: () => fetchClients(),
  }
}

export function useClient(id: string) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/clients/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du client')
      }

      const data = await response.json()
      setClient(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchClient()
    }
  }, [id])

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
  }
} 