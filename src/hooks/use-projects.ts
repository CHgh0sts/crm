'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  color: string
  startDate?: Date
  endDate?: Date
  budget?: number
  progress: number
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    company?: string
  }
  category?: {
    id: string
    name: string
    color: string
  }
  tasksCount: number
  completedTasks: number
  timeLogsCount: number
}

export interface CreateProjectData {
  name: string
  description?: string
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  color?: string
  startDate?: string
  endDate?: string
  budget?: number
  clientId?: string
  categoryId?: string
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  progress?: number
  isArchived?: boolean
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async (params?: {
    status?: string
    clientId?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.clientId) searchParams.set('clientId', params.clientId)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/projects?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des projets')
      }

      const data = await response.json()
      setProjects(data.projects)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: CreateProjectData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du projet')
      }

      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      toast.success('Projet créé avec succès')
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du projet'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateProject = async (id: string, projectData: UpdateProjectData) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du projet')
      }

      const updatedProject = await response.json()
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
      toast.success('Projet mis à jour avec succès')
      return updatedProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du projet'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteProject = async (id: string, forceDelete = false) => {
    try {
      const response = await fetch(`/api/projects/${id}${forceDelete ? '?force=true' : ''}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du projet')
      }

      const result = await response.json()
      
      if (forceDelete) {
        setProjects(prev => prev.filter(p => p.id !== id))
      } else {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p))
      }
      
      toast.success(result.message || 'Projet supprimé avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du projet'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Récupérer un projet spécifique
  const fetchProject = async (id: string): Promise<Project | null> => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du projet')
      }

      const data = await response.json()
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(errorMessage)
      return null
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    refetch: () => fetchProjects(),
  }
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du projet')
      }

      const data = await response.json()
      setProject(data)
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
      fetchProject()
    }
  }, [id])

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  }
} 