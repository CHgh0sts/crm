'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  number: string
  title: string
  description?: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    name: string
    company?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
  project?: {
    id: string
    name: string
    color: string
  }
  items: InvoiceItem[]
}

export interface CreateInvoiceData {
  title: string
  number?: string
  clientId: string
  projectId?: string
  issueDate: string
  dueDate: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate?: number
  }>
  notes?: string
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  taxRate?: number
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  paidDate?: string | null
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = async (params?: {
    status?: string
    clientId?: string
    projectId?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.clientId) searchParams.set('clientId', params.clientId)
      if (params?.projectId) searchParams.set('projectId', params.projectId)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/invoices?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des factures')
      }

      const data = await response.json()
      setInvoices(data.invoices)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async (invoiceData: CreateInvoiceData) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de la facture')
      }

      const newInvoice = await response.json()
      setInvoices(prev => [newInvoice, ...prev])
      toast.success('Facture créée avec succès')
      return newInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la facture'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateInvoice = async (id: string, invoiceData: UpdateInvoiceData) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la facture')
      }

      const updatedInvoice = await response.json()
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i))
      toast.success('Facture mise à jour avec succès')
      return updatedInvoice
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la facture'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression de la facture')
      }

      const result = await response.json()
      setInvoices(prev => prev.filter(i => i.id !== id))
      toast.success(result.message || 'Facture supprimée avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la facture'
      toast.error(errorMessage)
      throw err
    }
  }

  const markAsPaid = async (id: string, paidDate?: string) => {
    try {
      const updateData: UpdateInvoiceData = {
        status: 'PAID',
        paidDate: paidDate || new Date().toISOString(),
      }

      return await updateInvoice(id, updateData)
    } catch (err) {
      throw err
    }
  }

  const markAsSent = async (id: string) => {
    try {
      const updateData: UpdateInvoiceData = {
        status: 'SENT',
      }

      return await updateInvoice(id, updateData)
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    markAsSent,
    refetch: () => fetchInvoices(),
  }
}

export function useInvoice(id: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/invoices/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la facture')
      }

      const data = await response.json()
      setInvoice(data)
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
      fetchInvoice()
    }
  }, [id])

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice,
  }
}

// Hook pour les statistiques des factures
export function useInvoiceStats() {
  const { invoices } = useInvoices()

  const stats = {
    totalInvoices: invoices.length,
    draftInvoices: invoices.filter(i => i.status === 'DRAFT').length,
    sentInvoices: invoices.filter(i => i.status === 'SENT').length,
    paidInvoices: invoices.filter(i => i.status === 'PAID').length,
    overdueInvoices: invoices.filter(i => i.status === 'OVERDUE').length,
    totalRevenue: invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0),
    pendingRevenue: invoices
      .filter(i => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.total, 0),
    averageInvoiceValue: invoices.length > 0 
      ? invoices.reduce((sum, i) => sum + i.total, 0) / invoices.length 
      : 0,
  }

  return stats
} 