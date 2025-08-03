import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { startOfWeek, startOfMonth, endOfMonth, endOfWeek } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const now = new Date()
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }) // Lundi
    const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 })
    const startOfCurrentMonth = startOfMonth(now)
    const endOfCurrentMonth = endOfMonth(now)

    // Récupérer les statistiques de base en parallèle
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      invoiceStats,
      timeStats,
      runningTimers,
      upcomingTasks,
      recentActivities
    ] = await Promise.all([
      // Projets totaux
      prisma.project.count({
        where: { userId: user.id, isArchived: false }
      }),

      // Projets actifs
      prisma.project.count({
        where: { 
          userId: user.id, 
          isArchived: false,
          status: { in: ['PLANNING', 'IN_PROGRESS'] }
        }
      }),

      // Projets terminés
      prisma.project.count({
        where: { 
          userId: user.id, 
          isArchived: false,
          status: 'COMPLETED'
        }
      }),

      // Clients totaux
      prisma.client.count({
        where: { userId: user.id }
      }),

      // Statistiques des factures
      prisma.invoice.groupBy({
        by: ['status'],
        where: { userId: user.id },
        _count: { status: true },
        _sum: { total: true }
      }),

      // Statistiques du temps
      Promise.all([
        // Temps total logué
        prisma.timeLog.aggregate({
          where: { userId: user.id },
          _sum: { duration: true }
        }),
        // Temps cette semaine
        prisma.timeLog.aggregate({
          where: {
            userId: user.id,
            startTime: {
              gte: startOfCurrentWeek,
              lte: endOfCurrentWeek
            }
          },
          _sum: { duration: true }
        }),
        // Revenus mensuels
        prisma.timeLog.aggregate({
          where: {
            userId: user.id,
            isBillable: true,
            startTime: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth
            }
          },
          _sum: { duration: true }
        }),
        // Revenus totaux
        prisma.timeLog.aggregate({
          where: {
            userId: user.id,
            isBillable: true
          },
          _sum: { duration: true }
        })
      ]),

      // Timers en cours
      prisma.timeLog.findMany({
        where: {
          userId: user.id,
          isRunning: true
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),

      // Tâches à venir (échéances dans les 7 prochains jours)
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: { not: 'COMPLETED' },
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 10
      }),

      // Activités récentes (projets, factures, clients créés/modifiés récemment)
      Promise.all([
        // Projets récents
        prisma.project.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }),
        // Factures récentes
        prisma.invoice.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        }),
        // Clients récents
        prisma.client.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            name: true,
            company: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 3
        }),
        // Tâches récentes
        prisma.task.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            project: {
              select: {
                name: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        })
      ])
    ])

    // Traitement des statistiques des factures
    const totalInvoices = invoiceStats.reduce((sum, stat) => sum + stat._count.status, 0)
    const paidInvoices = invoiceStats.find(stat => stat.status === 'PAID')?._count.status || 0
    const pendingInvoices = invoiceStats.find(stat => stat.status === 'SENT')?._count.status || 0
    const overdueInvoices = invoiceStats.find(stat => stat.status === 'OVERDUE')?._count.status || 0

    // Calcul des revenus
    const totalRevenue = invoiceStats
      .filter(stat => stat.status === 'PAID')
      .reduce((sum, stat) => sum + (stat._sum.total || 0), 0)

    // Calcul des revenus depuis les time logs
    const [totalTimeLogged, weeklyTimeLogged, monthlyBillableTime, totalBillableTime] = timeStats
    
    // Approximation des revenus mensuels depuis les logs de temps (à 50€/h par défaut)
    const monthlyRevenue = (monthlyBillableTime._sum.duration || 0) / 60 * 50
    const totalTimeRevenue = (totalBillableTime._sum.duration || 0) / 60 * 50

    // Combinaison des revenus (factures + temps facturable)
    const combinedMonthlyRevenue = monthlyRevenue
    const combinedTotalRevenue = totalRevenue + totalTimeRevenue

    // Traitement des activités récentes
    const [recentProjects, recentInvoices, recentClients, recentTasks] = recentActivities
    
    const formattedActivities = [
      ...recentProjects.map(project => ({
        id: `project-${project.id}`,
        type: 'project' as const,
        title: `Projet ${project.name}`,
        description: `Statut: ${project.status}`,
        date: project.updatedAt,
        status: project.status
      })),
      ...recentInvoices.map(invoice => ({
        id: `invoice-${invoice.id}`,
        type: 'invoice' as const,
        title: `Facture ${invoice.number}`,
        description: invoice.title || 'Sans titre',
        date: invoice.updatedAt,
        status: invoice.status
      })),
      ...recentClients.map(client => ({
        id: `client-${client.id}`,
        type: 'client' as const,
        title: `Client ${client.name}`,
        description: client.company || 'Sans entreprise',
        date: client.updatedAt
      })),
      ...recentTasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        title: `Tâche: ${task.title}`,
        description: task.project?.name || 'Sans projet',
        date: task.updatedAt,
        status: task.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    // Formatage des tâches à venir
    const formattedUpcomingTasks = upcomingTasks.map(task => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate!,
      project: task.project?.name,
      priority: task.priority
    }))

    // Formatage des timers en cours
    const formattedRunningTimers = runningTimers.map(timer => ({
      id: timer.id,
      description: timer.description,
      project: timer.project?.name,
      startTime: timer.startTime
    }))

    const dashboardData = {
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalClients,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalRevenue: combinedTotalRevenue,
        monthlyRevenue: combinedMonthlyRevenue,
        totalTimeLogged: Math.round((totalTimeLogged._sum.duration || 0) / 60), // en heures
        weeklyTimeLogged: Math.round((weeklyTimeLogged._sum.duration || 0) / 60) // en heures
      },
      recentActivities: formattedActivities,
      upcomingTasks: formattedUpcomingTasks,
      runningTimers: formattedRunningTimers
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 