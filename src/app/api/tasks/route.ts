import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre de la tâche est requis'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  position: z.number().optional(),
})

// GET /api/tasks - Récupérer toutes les tâches de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const assigneeId = searchParams.get('assigneeId')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (priority) {
      where.priority = priority
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              status: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          timeLogs: {
            select: {
              id: true,
              duration: true,
            },
          },
          _count: {
            select: {
              timeLogs: true,
            },
          },
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    // Calculer le temps total pour chaque tâche
    const tasksWithStats = tasks.map(task => {
      const totalTime = task.timeLogs.reduce((total, log) => total + (log.duration || 0), 0)
      return {
        ...task,
        totalTimeSpent: totalTime, // en minutes
        totalTimeSpentHours: Math.round(totalTime / 60 * 100) / 100,
        timeLogsCount: task._count.timeLogs,
      }
    })

    return NextResponse.json({
      tasks: tasksWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const taskData: any = {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      estimatedHours: validatedData.estimatedHours,
      userId: user.id,
    }

    if (validatedData.dueDate) {
      taskData.dueDate = new Date(validatedData.dueDate)
    }

    // Gérer le projet
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

      taskData.projectId = validatedData.projectId
    }

    // Gérer l'assignation
    if (validatedData.assigneeId) {
      // Pour l'instant, on permet seulement d'assigner à soi-même
      // Plus tard, on pourra gérer les équipes
      if (validatedData.assigneeId !== user.id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez assigner qu\'à vous-même pour le moment' },
          { status: 400 }
        )
      }
      taskData.assigneeId = validatedData.assigneeId
    }

    // Gérer la position
    if (validatedData.position !== undefined) {
      taskData.position = validatedData.position
    } else {
      // Calculer la prochaine position
      const lastTask = await prisma.task.findFirst({
        where: {
          userId: user.id,
          projectId: validatedData.projectId || null,
        },
        orderBy: {
          position: 'desc',
        },
      })
      taskData.position = (lastTask?.position || 0) + 1
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            timeLogs: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error)

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

// PATCH /api/tasks - Mettre à jour plusieurs tâches (pour le drag & drop Kanban)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { tasks } = body

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      )
    }

    // Mettre à jour les tâches en batch
    const updatePromises = tasks.map((task: any) => {
      return prisma.task.updateMany({
        where: {
          id: task.id,
          userId: user.id,
        },
        data: {
          status: task.status,
          position: task.position,
          updatedAt: new Date(),
        },
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tâches:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 