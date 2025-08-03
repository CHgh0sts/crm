'use client'

import { useState, useEffect } from 'react'

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalClients: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalRevenue: number
  monthlyRevenue: number
  totalTimeLogged: number
  weeklyTimeLogged: number
}

export interface RecentActivity {
  id: string
  type: 'project' | 'invoice' | 'client' | 'task' | 'time'
  title: string
  description: string
  date: Date
  status?: string
}

export interface DashboardData {
  stats: DashboardStats
  recentActivities: RecentActivity[]
  upcomingTasks: Array<{
    id: string
    title: string
    dueDate: Date
    project?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }>
  runningTimers: Array<{
    id: string
    description: string
    project?: string
    startTime: Date
  }>
}

const defaultStats: DashboardStats = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalClients: 0,
  totalInvoices: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalTimeLogged: 0,
  weeklyTimeLogged: 0,
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const dashboardData = await response.json()

      // Convertir les dates en objets Date
      const processedData: DashboardData = {
        ...dashboardData,
        recentActivities: dashboardData.recentActivities.map((activity: any) => ({
          ...activity,
          date: new Date(activity.date)
        })),
        upcomingTasks: dashboardData.upcomingTasks.map((task: any) => ({
          ...task,
          dueDate: new Date(task.dueDate)
        })),
        runningTimers: dashboardData.runningTimers.map((timer: any) => ({
          ...timer,
          startTime: new Date(timer.startTime)
        }))
      }
      
      setData(processedData)
    } catch (err) {
      console.error('Erreur lors du chargement des données du dashboard:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchDashboardData 
  }
} 