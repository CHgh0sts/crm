'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Email {
  id: string
  messageId: string
  subject: string
  htmlContent: string
  textContent?: string
  fromEmail: string
  fromName?: string
  toEmail: string
  toName?: string
  ccEmails?: string[]
  bccEmails?: string[]
  replyToEmail?: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED' | 'BOUNCED' | 'FAILED'
  
  // Tracking
  openedAt?: Date
  openedIpAddress?: string
  openedUserAgent?: string
  openCount: number
  respondedAt?: Date
  responseCount: number
  lastResponseAt?: Date
  
  // Metadata
  sentAt?: Date
  scheduledAt?: Date
  bounced: boolean
  bouncedAt?: Date
  bounceReason?: string
  
  // Threading
  inReplyTo?: string
  references?: string
  threadId?: string
  
  // Relations
  client?: {
    id: string
    name: string
    company?: string
    email?: string
    phone?: string
  }
  project?: {
    id: string
    name: string
    color: string
    status: string
  }
  invoice?: {
    id: string
    number: string
    title: string
    status: string
    total: number
  }
  quote?: {
    id: string
    number: string
    title: string
    status: string
    total: number
  }
  parentEmail?: {
    id: string
    subject: string
    sentAt?: Date
    messageId: string
  }
  replies?: Array<{
    id: string
    subject: string
    sentAt?: Date
    status: string
    fromEmail: string
    fromName?: string
  }>
  
  createdAt: Date
  updatedAt: Date
}

export interface CreateEmailData {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
  fromName?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  clientId?: string
  projectId?: string
  invoiceId?: string
  quoteId?: string
  scheduledAt?: Date
  sendNow?: boolean
}

export interface UpdateEmailData {
  subject?: string
  htmlContent?: string
  textContent?: string
  toName?: string
  fromName?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  scheduledAt?: Date
  status?: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REPLIED' | 'BOUNCED' | 'FAILED'
}

export interface EmailStats {
  total: number
  draft: number
  sent: number
  opened: number
  replied: number
  bounced: number
}

export interface EmailFilters {
  page?: number
  limit?: number
  status?: string
  clientId?: string
  projectId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([])
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    draft: 0,
    sent: 0,
    opened: 0,
    replied: 0,
    bounced: 0,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Récupérer la liste des emails
  const fetchEmails = async (filters: EmailFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      
      if (filters.page) searchParams.set('page', filters.page.toString())
      if (filters.limit) searchParams.set('limit', filters.limit.toString())
      if (filters.status) searchParams.set('status', filters.status)
      if (filters.clientId) searchParams.set('clientId', filters.clientId)
      if (filters.projectId) searchParams.set('projectId', filters.projectId)
      if (filters.search) searchParams.set('search', filters.search)
      if (filters.sortBy) searchParams.set('sortBy', filters.sortBy)
      if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/emails?${searchParams}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des emails')
      }

      setEmails(data.emails.map((email: any) => ({
        ...email,
        ccEmails: email.ccEmails ? JSON.parse(email.ccEmails) : [],
        bccEmails: email.bccEmails ? JSON.parse(email.bccEmails) : [],
        createdAt: new Date(email.createdAt),
        updatedAt: new Date(email.updatedAt),
        sentAt: email.sentAt ? new Date(email.sentAt) : undefined,
        scheduledAt: email.scheduledAt ? new Date(email.scheduledAt) : undefined,
        openedAt: email.openedAt ? new Date(email.openedAt) : undefined,
        respondedAt: email.respondedAt ? new Date(email.respondedAt) : undefined,
        lastResponseAt: email.lastResponseAt ? new Date(email.lastResponseAt) : undefined,
        bouncedAt: email.bouncedAt ? new Date(email.bouncedAt) : undefined,
      })))
      
      setStats(data.stats)
      setPagination(data.pagination)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(`Erreur: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Récupérer un email spécifique
  const fetchEmail = async (id: string): Promise<Email | null> => {
    try {
      const response = await fetch(`/api/emails/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération de l\'email')
      }

      return {
        ...data.email,
        ccEmails: data.email.ccEmails ? JSON.parse(data.email.ccEmails) : [],
        bccEmails: data.email.bccEmails ? JSON.parse(data.email.bccEmails) : [],
        createdAt: new Date(data.email.createdAt),
        updatedAt: new Date(data.email.updatedAt),
        sentAt: data.email.sentAt ? new Date(data.email.sentAt) : undefined,
        scheduledAt: data.email.scheduledAt ? new Date(data.email.scheduledAt) : undefined,
        openedAt: data.email.openedAt ? new Date(data.email.openedAt) : undefined,
        respondedAt: data.email.respondedAt ? new Date(data.email.respondedAt) : undefined,
        lastResponseAt: data.email.lastResponseAt ? new Date(data.email.lastResponseAt) : undefined,
        bouncedAt: data.email.bouncedAt ? new Date(data.email.bouncedAt) : undefined,
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur: ${errorMessage}`)
      return null
    }
  }

  // Créer un nouvel email
  const createEmail = async (emailData: CreateEmailData): Promise<boolean> => {
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de l\'email')
      }

      toast.success(data.message || 'Email créé avec succès')
      
      // Rafraîchir la liste si on est sur la même page
      await fetchEmails()
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur: ${errorMessage}`)
      return false
    }
  }

  // Mettre à jour un email
  const updateEmail = async (id: string, emailData: UpdateEmailData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'email')
      }

      toast.success(data.message || 'Email mis à jour avec succès')
      
      // Mettre à jour l'email dans la liste locale
      setEmails(prev => prev.map(email => 
        email.id === id 
          ? {
              ...data.email,
              ccEmails: data.email.ccEmails ? JSON.parse(data.email.ccEmails) : [],
              bccEmails: data.email.bccEmails ? JSON.parse(data.email.bccEmails) : [],
              createdAt: new Date(data.email.createdAt),
              updatedAt: new Date(data.email.updatedAt),
            }
          : email
      ))
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur: ${errorMessage}`)
      return false
    }
  }

  // Supprimer un email
  const deleteEmail = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de l\'email')
      }

      toast.success(data.message || 'Email supprimé avec succès')
      
      // Retirer l'email de la liste locale
      setEmails(prev => prev.filter(email => email.id !== id))
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur: ${errorMessage}`)
      return false
    }
  }

  // Envoyer un email existant
  const sendEmail = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/emails/${id}/send`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email')
      }

      toast.success(data.message || 'Email envoyé avec succès')
      
      // Mettre à jour l'email dans la liste locale
      setEmails(prev => prev.map(email => 
        email.id === id 
          ? {
              ...data.email,
              createdAt: new Date(data.email.createdAt),
              updatedAt: new Date(data.email.updatedAt),
              sentAt: new Date(data.email.sentAt),
            }
          : email
      ))
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Erreur: ${errorMessage}`)
      return false
    }
  }

  return {
    emails,
    stats,
    pagination,
    loading,
    error,
    fetchEmails,
    fetchEmail,
    createEmail,
    updateEmail,
    deleteEmail,
    sendEmail,
  }
} 