'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  completedAt?: Date
  estimatedHours?: number
  position: number
  createdAt: Date
  updatedAt: Date
  project?: {
    id: string
    name: string
    color: string
    status: string
  }
  owner: {
    id: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  assignee?: {
    id: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  totalTimeSpent: number
  totalTimeSpentHours: number
  timeLogsCount: number
}

export interface CreateTaskData {
  title: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  estimatedHours?: number
  projectId?: string
  assigneeId?: string
  position?: number
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completedAt?: string | null
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async (params?: {
    status?: string
    projectId?: string
    assigneeId?: string
    priority?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.projectId) searchParams.set('projectId', params.projectId)
      if (params?.assigneeId) searchParams.set('assigneeId', params.assigneeId)
      if (params?.priority) searchParams.set('priority', params.priority)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/tasks?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches')
      }

      const data = await response.json()
      setTasks(data.tasks)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: CreateTaskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de la tâche')
      }

      const newTask = await response.json()
      setTasks(prev => [newTask, ...prev])
      toast.success('Tâche créée avec succès')
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la tâche'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateTask = async (id: string, taskData: UpdateTaskData) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la tâche')
      }

      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      toast.success('Tâche mise à jour avec succès')
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la tâche'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateTasksBatch = async (tasks: Array<{ id: string; status: string; position: number }>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour des tâches')
      }

      // Recharger les tâches pour avoir les données à jour
      await fetchTasks()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des tâches'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression de la tâche')
      }

      const result = await response.json()
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success(result.message || 'Tâche supprimée avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la tâche'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTasksBatch,
    deleteTask,
    refetch: () => fetchTasks(),
  }
}

export function useTask(id: string) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tasks/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la tâche')
      }

      const data = await response.json()
      setTask(data)
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
      fetchTask()
    }
  }, [id])

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
  }
}

// Hook pour organiser les tâches par statut (pour le Kanban)
export function useTasksByStatus(projectId?: string) {
  const { tasks, loading, error, updateTasksBatch, refetch } = useTasks()

  const [tasksByStatus, setTasksByStatus] = useState({
    TODO: [] as Task[],
    IN_PROGRESS: [] as Task[],
    IN_REVIEW: [] as Task[],
    COMPLETED: [] as Task[],
    CANCELLED: [] as Task[],
  })

  useEffect(() => {
    let filteredTasks = tasks
    if (projectId) {
      filteredTasks = tasks.filter(task => task.project?.id === projectId)
    }

    const grouped = filteredTasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = []
      }
      acc[task.status].push(task)
      return acc
    }, {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      IN_REVIEW: [] as Task[],
      COMPLETED: [] as Task[],
      CANCELLED: [] as Task[],
    })

    // Trier par position
    Object.keys(grouped).forEach(status => {
      grouped[status as keyof typeof grouped].sort((a, b) => a.position - b.position)
    })

    setTasksByStatus(grouped)
  }, [tasks, projectId])

  const moveTask = async (
    taskId: string,
    newStatus: string,
    newPosition: number,
    sourceIndex: number,
    destIndex: number
  ) => {
    // Optimistic update
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const sourceStatus = task.status
    const newTasksByStatus = { ...tasksByStatus }

    // Retirer de la source
    newTasksByStatus[sourceStatus] = newTasksByStatus[sourceStatus].filter(t => t.id !== taskId)

    // Ajouter à la destination
    const updatedTask = { ...task, status: newStatus as any, position: newPosition }
    newTasksByStatus[newStatus as keyof typeof newTasksByStatus].splice(destIndex, 0, updatedTask)

    // Mettre à jour les positions
    newTasksByStatus[newStatus as keyof typeof newTasksByStatus].forEach((t, index) => {
      t.position = index
    })

    setTasksByStatus(newTasksByStatus)

    try {
      // Préparer les tâches à mettre à jour
      const tasksToUpdate = newTasksByStatus[newStatus as keyof typeof newTasksByStatus].map((t, index) => ({
        id: t.id,
        status: newStatus,
        position: index,
      }))

      await updateTasksBatch(tasksToUpdate)
    } catch (error) {
      // Revenir en arrière en cas d'erreur
      await refetch()
    }
  }

  return {
    tasksByStatus,
    loading,
    error,
    moveTask,
    refetch,
  }
} 