'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Contact } from './use-clients'

export interface CreateContactData {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  position?: string
  notes?: string
  isPrimary: boolean
  clientId: string
}

export interface UpdateContactData extends Partial<CreateContactData> {}

export function useContacts(clientId: string) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/clients/${clientId}/contacts`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des contacts')
      }

      const data = await response.json()
      setContacts(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createContact = async (contactData: CreateContactData) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du contact')
      }

      const newContact = await response.json()
      setContacts(prev => [newContact, ...prev])
      toast.success('Contact créé avec succès')
      return newContact
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du contact'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateContact = async (id: string, contactData: UpdateContactData) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du contact')
      }

      const updatedContact = await response.json()
      setContacts(prev => prev.map(c => c.id === id ? updatedContact : c))
      toast.success('Contact mis à jour avec succès')
      return updatedContact
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du contact'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/contacts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du contact')
      }

      const result = await response.json()
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success(result.message || 'Contact supprimé avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du contact'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchContacts()
    }
  }, [clientId])

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  }
} 