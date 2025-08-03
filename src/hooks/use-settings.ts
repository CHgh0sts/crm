'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface UserSettings {
  // Profil
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  avatar?: string

  // Préférences
  currency: string
  timezone: string
  language: string
  theme: string

  // Entreprise (optionnel - peut être séparé)
  businessInfo?: {
    companyName?: string
    companyAddress?: string
    companyPhone?: string
    companyEmail?: string
    siret?: string
    tvaNumber?: string
    defaultHourlyRate?: number
    invoicePrefix?: string
    quotePrefix?: string
  }

  // Notifications
  notifications?: {
    emailNotifications: boolean
    pushNotifications: boolean
    taskReminders: boolean
    invoiceReminders: boolean
    projectUpdates: boolean
    clientMessages: boolean
  }
}

export interface UpdateSettingsData {
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  avatar?: string
  currency?: string
  timezone?: string
  language?: string
  theme?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Récupérer les paramètres utilisateur
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/settings')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paramètres')
      }

      const data = await response.json()
      setSettings(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Mettre à jour les paramètres généraux
  const updateSettings = async (settingsData: UpdateSettingsData) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des paramètres')
      }

      const updatedSettings = await response.json()
      setSettings(prev => ({ ...prev, ...updatedSettings }))
      
      toast.success('Paramètres mis à jour avec succès')
      return updatedSettings
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des paramètres'
      toast.error(errorMessage)
      throw err
    }
  }

  // Changer le mot de passe
  const changePassword = async (passwordData: ChangePasswordData) => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas')
      }

      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du changement de mot de passe')
      }

      toast.success('Mot de passe changé avec succès')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe'
      toast.error(errorMessage)
      throw err
    }
  }

  // Mettre à jour les préférences de notifications
  const updateNotifications = async (notifications: UserSettings['notifications']) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des notifications')
      }

      const result = await response.json()
      setSettings(prev => prev ? { ...prev, notifications: result.notifications } : null)
      
      toast.success('Préférences de notifications mises à jour')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des notifications'
      toast.error(errorMessage)
      throw err
    }
  }

  // Upload d'avatar
  const uploadAvatar = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'upload de l\'avatar')
      }

      const result = await response.json()
      setSettings(prev => prev ? { ...prev, avatar: result.avatarUrl } : null)
      
      toast.success('Avatar mis à jour avec succès')
      return result.avatarUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'avatar'
      toast.error(errorMessage)
      throw err
    }
  }

  // Exporter les données
  const exportData = async () => {
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'exportation des données')
      }

      const result = await response.json()
      toast.success('Demande d\'exportation soumise. Vous recevrez un email avec le lien de téléchargement.')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'exportation des données'
      toast.error(errorMessage)
      throw err
    }
  }

  // Supprimer le compte
  const deleteAccount = async (password: string) => {
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du compte')
      }

      const result = await response.json()
      toast.success('Compte supprimé avec succès')
      
      // Rediriger vers la page de connexion ou d'accueil
      window.location.href = '/login'
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du compte'
      toast.error(errorMessage)
      throw err
    }
  }

  // Déconnecter toutes les sessions
  const logoutAllSessions = async () => {
    try {
      const response = await fetch('/api/user/logout-all', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la déconnexion')
      }

      toast.success('Toutes les sessions ont été fermées')
      
      // Rediriger vers la page de connexion
      window.location.href = '/login'
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la déconnexion'
      toast.error(errorMessage)
      throw err
    }
  }

  // Charger les paramètres au montage
  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    changePassword,
    updateNotifications,
    uploadAvatar,
    exportData,
    deleteAccount,
    logoutAllSessions,
    refetch: fetchSettings,
  }
} 