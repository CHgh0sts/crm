'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface TimeLog {
  id: string
  description: string
  startTime: Date
  endTime?: Date
  duration?: number // en minutes
  isRunning: boolean
  isBillable: boolean
  hourlyRate?: number
  createdAt: Date
  updatedAt: Date
  project?: {
    id: string
    name: string
    color: string
    client?: {
      id: string
      name: string
      company?: string
    }
  }
  task?: {
    id: string
    title: string
    status: string
    priority: string
  }
  user: {
    id: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

export interface CreateTimeLogData {
  description: string
  startTime: string
  endTime?: string
  duration?: number
  projectId?: string
  taskId?: string
  isRunning?: boolean
  isBillable?: boolean
  hourlyRate?: number
}

export interface UpdateTimeLogData extends Partial<CreateTimeLogData> {}

export interface TimeTrackingStats {
  totalDuration: number // en minutes
  totalHours: number
  billableDuration: number
  billableHours: number
  totalRevenue: number
  runningLogs: number
}

export function useTimeLogs() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TimeTrackingStats>({
    totalDuration: 0,
    totalHours: 0,
    billableDuration: 0,
    billableHours: 0,
    totalRevenue: 0,
    runningLogs: 0,
  })

  const fetchTimeLogs = async (params?: {
    projectId?: string
    taskId?: string
    isRunning?: boolean
    isBillable?: boolean
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.projectId) searchParams.set('projectId', params.projectId)
      if (params?.taskId) searchParams.set('taskId', params.taskId)
      if (params?.isRunning !== undefined) searchParams.set('isRunning', params.isRunning.toString())
      if (params?.isBillable !== undefined) searchParams.set('isBillable', params.isBillable.toString())
      if (params?.startDate) searchParams.set('startDate', params.startDate)
      if (params?.endDate) searchParams.set('endDate', params.endDate)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/time-logs?${searchParams}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des logs de temps')
      }

      const data = await response.json()
      setTimeLogs(data.timeLogs)
      setStats(data.stats)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createTimeLog = async (timeLogData: CreateTimeLogData) => {
    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeLogData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du log de temps')
      }

      const newTimeLog = await response.json()
      
      // Mise à jour optimiste immédiate pour que le timer apparaisse instantanément
      setTimeLogs(prev => [newTimeLog, ...prev])
      
      // Mettre à jour les stats si c'est un timer qui démarre
      if (newTimeLog.isRunning) {
        setStats(prev => ({
          ...prev,
          runningLogs: prev.runningLogs + 1
        }))
      } else if (newTimeLog.duration) {
        // Si c'est un log terminé, mettre à jour les stats
        setStats(prev => ({
          ...prev,
          totalDuration: prev.totalDuration + (newTimeLog.duration || 0),
          billableDuration: newTimeLog.isBillable ? prev.billableDuration + (newTimeLog.duration || 0) : prev.billableDuration,
          totalRevenue: newTimeLog.isBillable && newTimeLog.hourlyRate 
            ? prev.totalRevenue + ((newTimeLog.duration || 0) / 60 * newTimeLog.hourlyRate)
            : prev.totalRevenue
        }))
      }
      
      toast.success('Log de temps créé avec succès')
      return newTimeLog
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du log de temps'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateTimeLog = async (id: string, timeLogData: UpdateTimeLogData) => {
    try {
      const response = await fetch(`/api/time-logs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeLogData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du log de temps')
      }

      const updatedTimeLog = await response.json()
      
      // Refetch immédiat pour garantir la synchronisation
      await fetchTimeLogs()
      
      toast.success('Log de temps mis à jour avec succès')
      return updatedTimeLog
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du log de temps'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteTimeLog = async (id: string) => {
    try {
      const response = await fetch(`/api/time-logs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression du log de temps')
      }

      const result = await response.json()
      
      // Refetch immédiat pour garantir la synchronisation
      await fetchTimeLogs()
      
      toast.success(result.message || 'Log de temps supprimé avec succès')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du log de temps'
      toast.error(errorMessage)
      throw err
    }
  }

  const startTimer = async (description: string, projectId?: string, taskId?: string, hourlyRate?: number) => {
    try {
      const timeLogData: CreateTimeLogData = {
        description,
        startTime: new Date().toISOString(),
        projectId,
        taskId,
        isRunning: true,
        isBillable: true,
        hourlyRate,
      }

      return await createTimeLog(timeLogData)
    } catch (err) {
      throw err
    }
  }

  const stopTimer = async () => {
    try {
      // Trouver le timer en cours pour mise à jour optimiste
      const runningLog = timeLogs.find(log => log.isRunning)
      
      if (!runningLog) {
        toast.error('Aucun timer en cours trouvé')
        return
      }

      // Mise à jour optimiste immédiate - marquer comme arrêté avec durée calculée
      const now = new Date()
      const startTime = new Date(runningLog.startTime)
      const durationMs = now.getTime() - startTime.getTime()
      const durationMinutes = Math.floor(durationMs / 60000)
      
      const stoppedLog = {
        ...runningLog,
        isRunning: false,
        endTime: now,
        duration: durationMinutes
      }
      
      setTimeLogs(prev => prev.map(t => 
        t.id === runningLog.id ? stoppedLog : t
      ))

      // Mettre à jour les stats immédiatement
      setStats(prev => ({
        ...prev,
        runningLogs: Math.max(0, prev.runningLogs - 1),
        totalDuration: prev.totalDuration + durationMinutes,
        billableDuration: runningLog.isBillable ? prev.billableDuration + durationMinutes : prev.billableDuration,
        totalRevenue: runningLog.isBillable && runningLog.hourlyRate 
          ? prev.totalRevenue + (durationMinutes / 60 * runningLog.hourlyRate)
          : prev.totalRevenue
      }))

      const response = await fetch('/api/time-logs?action=stop', {
        method: 'PATCH',
      })

              if (!response.ok) {
          // En cas d'erreur, restaurer l'état précédent (timer + stats)
          setTimeLogs(prev => prev.map(t => 
            t.id === runningLog.id ? runningLog : t
          ))
          
          setStats(prev => ({
            ...prev,
            runningLogs: prev.runningLogs + 1,
            totalDuration: prev.totalDuration - durationMinutes,
            billableDuration: runningLog.isBillable ? prev.billableDuration - durationMinutes : prev.billableDuration,
            totalRevenue: runningLog.isBillable && runningLog.hourlyRate 
              ? prev.totalRevenue - (durationMinutes / 60 * runningLog.hourlyRate)
              : prev.totalRevenue
          }))
          
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur lors de l\'arrêt du timer')
        }

      const stoppedTimeLog = await response.json()
      
      // Refetch pour avoir les données définitives de l'API
      await fetchTimeLogs()
      
      toast.success('Timer arrêté avec succès')
      return stoppedTimeLog
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'arrêt du timer'
      toast.error(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchTimeLogs()
  }, [])

  // Trouver le timer en cours
  const runningTimer = timeLogs.find(log => log.isRunning)

  return {
    timeLogs,
    loading,
    error,
    stats,
    runningTimer,
    fetchTimeLogs,
    createTimeLog,
    updateTimeLog,
    deleteTimeLog,
    startTimer,
    stopTimer,
    refetch: () => fetchTimeLogs(),
  }
}

export function useTimeLog(id: string) {
  const [timeLog, setTimeLog] = useState<TimeLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeLog = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/time-logs/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du log de temps')
      }

      const data = await response.json()
      setTimeLog(data)
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
      fetchTimeLog()
    }
  }, [id])

  return {
    timeLog,
    loading,
    error,
    refetch: fetchTimeLog,
  }
}

// Hook pour les statistiques de temps par période
export function useTimeStats(startDate?: string, endDate?: string) {
  const [stats, setStats] = useState({
    dailyStats: [] as Array<{ date: string; duration: number; revenue: number }>,
    weeklyTotal: 0,
    monthlyTotal: 0,
    totalRevenue: 0,
    averagePerDay: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      const searchParams = new URLSearchParams()
      if (startDate) searchParams.set('startDate', startDate)
      if (endDate) searchParams.set('endDate', endDate)

      const response = await fetch(`/api/time-logs?${searchParams}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des logs de temps')
      }
      
      const { timeLogs } = await response.json()
      
      // Calculer les statistiques par jour
      const dailyStats = timeLogs.reduce((acc: any, log: TimeLog) => {
        const date = new Date(log.startTime).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, duration: 0, revenue: 0 }
        }
        acc[date].duration += log.duration || 0
        if (log.isBillable && log.hourlyRate) {
          const hours = (log.duration || 0) / 60
          acc[date].revenue += hours * log.hourlyRate
        }
        return acc
      }, {})

      const dailyStatsArray = Object.values(dailyStats) as Array<{ date: string; duration: number; revenue: number }>
      const totalDuration = dailyStatsArray.reduce((sum, day: any) => sum + day.duration, 0)
      const totalRevenue = dailyStatsArray.reduce((sum, day: any) => sum + day.revenue, 0)

      setStats({
        dailyStats: dailyStatsArray.sort((a, b) => a.date.localeCompare(b.date)),
        weeklyTotal: totalDuration,
        monthlyTotal: totalDuration,
        totalRevenue,
        averagePerDay: dailyStatsArray.length > 0 ? totalDuration / dailyStatsArray.length : 0,
      })
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [startDate, endDate])

  return { stats, loading, refetch: fetchStats }
}

// Utilitaires pour formater le temps
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}min`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}min`
  }
}

export function formatHours(minutes: number): string {
  const hours = Math.round(minutes / 60 * 100) / 100
  return `${hours}h`
} 