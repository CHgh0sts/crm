import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Le titre de la tâche est requis').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  position: z.number().optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
})

// GET /api/tasks/[id] - Récupérer une tâche spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const task = await prisma.task.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
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
          include: {
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
        },
        _count: {
          select: {
            timeLogs: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tâche introuvable' },
        { status: 404 }
      )
    }

    // Calculer les statistiques de la tâche
    const totalTimeSpent = task.timeLogs.reduce((total, log) => total + (log.duration || 0), 0)
    const activeTimeLogs = task.timeLogs.filter(log => log.isRunning)

    const taskWithStats = {
      ...task,
      stats: {
        totalTimeSpent, // en minutes
        totalTimeSpentHours: Math.round(totalTimeSpent / 60 * 100) / 100,
        timeLogsCount: task._count.timeLogs,
        hasActiveTimer: activeTimeLogs.length > 0,
        activeTimer: activeTimeLogs[0] || null,
      },
    }

    return NextResponse.json(taskWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Mettre à jour une tâche
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la tâche appartient à l'utilisateur
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tâche introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const updateData: any = {}

    // Copier les champs simples
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours
    if (validatedData.position !== undefined) updateData.position = validatedData.position

    // Gérer le statut et la date de complétion
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      
      // Si la tâche est marquée comme terminée, mettre à jour la date de complétion
      if (validatedData.status === 'COMPLETED' && !existingTask.completedAt) {
        updateData.completedAt = new Date()
      } else if (validatedData.status !== 'COMPLETED' && existingTask.completedAt) {
        updateData.completedAt = null
      }
    }

    // Gérer la date de complétion manuelle
    if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null
    }

    // Gérer la date d'échéance
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }

    // Gérer le projet
    if (validatedData.projectId !== undefined) {
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
      updateData.projectId = validatedData.projectId
    }

    // Gérer l'assignation
    if (validatedData.assigneeId !== undefined) {
      if (validatedData.assigneeId) {
        // Pour l'instant, on permet seulement d'assigner à soi-même
        if (validatedData.assigneeId !== user.id) {
          return NextResponse.json(
            { error: 'Vous ne pouvez assigner qu\'à vous-même pour le moment' },
            { status: 400 }
          )
        }
      }
      updateData.assigneeId = validatedData.assigneeId
    }

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)

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

// DELETE /api/tasks/[id] - Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la tâche appartient à l'utilisateur
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tâche introuvable' },
        { status: 404 }
      )
    }

    // Supprimer la tâche (les logs de temps seront également supprimés grâce à la cascade)
    await prisma.task.delete({
      where: { id: id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Tâche supprimée avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 