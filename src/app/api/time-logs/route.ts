import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createTimeLogSchema = z.object({
  description: z.string().min(1, 'La description est requise'),
  startTime: z.string().transform((date) => new Date(date)),
  endTime: z.string().transform((date) => new Date(date)).optional(),
  duration: z.number().min(0).optional(), // en minutes
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  isRunning: z.boolean().default(false),
  isBillable: z.boolean().default(true),
  hourlyRate: z.number().min(0).optional(),
})

const updateTimeLogSchema = z.object({
  description: z.string().min(1, 'La description est requise').optional(),
  startTime: z.string().transform((date) => new Date(date)).optional(),
  endTime: z.string().transform((date) => new Date(date)).nullable().optional(),
  duration: z.number().min(0).optional(),
  projectId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  isRunning: z.boolean().optional(),
  isBillable: z.boolean().optional(),
  hourlyRate: z.number().min(0).nullable().optional(),
})

// Calculer la durée en minutes entre deux dates
function calculateDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

// GET /api/time-logs - Récupérer tous les logs de temps de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const isRunning = searchParams.get('isRunning')
    const isBillable = searchParams.get('isBillable')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (taskId) {
      where.taskId = taskId
    }

    if (isRunning !== null) {
      where.isRunning = isRunning === 'true'
    }

    if (isBillable !== null) {
      where.isBillable = isBillable === 'true'
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate)
      }
    }

    const [timeLogs, totalCount] = await Promise.all([
      prisma.timeLog.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.timeLog.count({ where }),
    ])

    // Calculer les statistiques
    const totalDuration = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
    const billableDuration = timeLogs
      .filter(log => log.isBillable)
      .reduce((sum, log) => sum + (log.duration || 0), 0)
    
    const totalRevenue = timeLogs
      .filter(log => log.isBillable && log.hourlyRate)
      .reduce((sum, log) => {
        const hours = (log.duration || 0) / 60
        return sum + (hours * (log.hourlyRate || 0))
      }, 0)

    return NextResponse.json({
      timeLogs,
      stats: {
        totalDuration, // en minutes
        totalHours: Math.round(totalDuration / 60 * 100) / 100,
        billableDuration,
        billableHours: Math.round(billableDuration / 60 * 100) / 100,
        totalRevenue,
        runningLogs: timeLogs.filter(log => log.isRunning).length,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des logs de temps:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/time-logs - Créer un nouveau log de temps
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTimeLogSchema.parse(body)

    // Vérifier qu'il n'y a pas déjà un timer en cours pour cet utilisateur
    if (validatedData.isRunning) {
      const runningTimer = await prisma.timeLog.findFirst({
        where: {
          userId: user.id,
          isRunning: true,
        },
      })

      if (runningTimer) {
        return NextResponse.json(
          { error: 'Vous avez déjà un timer en cours. Arrêtez-le avant d\'en démarrer un nouveau.' },
          { status: 400 }
        )
      }
    }

    // Vérifier le projet si spécifié
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          userId: user.id,
        },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Projet introuvable' },
          { status: 404 }
        )
      }
    }

    // Vérifier la tâche si spécifiée
    if (validatedData.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: validatedData.taskId,
          userId: user.id,
        },
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Tâche introuvable' },
          { status: 404 }
        )
      }
    }

    // Calculer la durée si endTime est fourni
    let duration = validatedData.duration
    if (validatedData.endTime && !validatedData.isRunning) {
      duration = calculateDuration(validatedData.startTime, validatedData.endTime)
    }

    // Créer le log de temps
    const timeLog = await prisma.timeLog.create({
      data: {
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        duration,
        projectId: validatedData.projectId,
        taskId: validatedData.taskId,
        userId: user.id,
        isRunning: validatedData.isRunning,
        isBillable: validatedData.isBillable,
        hourlyRate: validatedData.hourlyRate,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du log de temps:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PATCH /api/time-logs/stop - Arrêter le timer en cours
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stop') {
      // Trouver le timer en cours
      const runningTimer = await prisma.timeLog.findFirst({
        where: {
          userId: user.id,
          isRunning: true,
        },
      })

      if (!runningTimer) {
        return NextResponse.json(
          { error: 'Aucun timer en cours' },
          { status: 404 }
        )
      }

      const endTime = new Date()
      const duration = calculateDuration(runningTimer.startTime, endTime)

      // Arrêter le timer
      const updatedTimeLog = await prisma.timeLog.update({
        where: { id: runningTimer.id },
        data: {
          endTime,
          duration,
          isRunning: false,
          updatedAt: new Date(),
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      })

      return NextResponse.json(updatedTimeLog)
    }

    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du timer:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 