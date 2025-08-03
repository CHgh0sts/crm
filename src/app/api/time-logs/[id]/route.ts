import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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

// GET /api/time-logs/[id] - Récupérer un log de temps spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const timeLog = await prisma.timeLog.findFirst({
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

    if (!timeLog) {
      return NextResponse.json(
        { error: 'Log de temps introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(timeLog)
  } catch (error) {
    console.error('Erreur lors de la récupération du log de temps:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/time-logs/[id] - Mettre à jour un log de temps
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le log de temps appartient à l'utilisateur
    const existingTimeLog = await prisma.timeLog.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingTimeLog) {
      return NextResponse.json(
        { error: 'Log de temps introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateTimeLogSchema.parse(body)

    const updateData: any = {}

    // Copier les champs simples
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.startTime !== undefined) updateData.startTime = validatedData.startTime
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration
    if (validatedData.isRunning !== undefined) updateData.isRunning = validatedData.isRunning
    if (validatedData.isBillable !== undefined) updateData.isBillable = validatedData.isBillable
    if (validatedData.hourlyRate !== undefined) updateData.hourlyRate = validatedData.hourlyRate

    // Gérer endTime et recalculer la durée si nécessaire
    if (validatedData.endTime !== undefined) {
      updateData.endTime = validatedData.endTime
      
      // Recalculer la durée si on a startTime et endTime
      if (validatedData.endTime && updateData.startTime) {
        updateData.duration = calculateDuration(updateData.startTime, validatedData.endTime)
      } else if (validatedData.endTime && existingTimeLog.startTime) {
        updateData.duration = calculateDuration(existingTimeLog.startTime, validatedData.endTime)
      }
    }

    // Si on change startTime et qu'on a endTime, recalculer la durée
    if (validatedData.startTime && (updateData.endTime || existingTimeLog.endTime)) {
      const endTime = updateData.endTime || existingTimeLog.endTime
      if (endTime) {
        updateData.duration = calculateDuration(validatedData.startTime, endTime)
      }
    }

    // Vérifier le projet si spécifié
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

    // Vérifier la tâche si spécifiée
    if (validatedData.taskId !== undefined) {
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
      updateData.taskId = validatedData.taskId
    }

    // Si on arrête un timer en cours, s'assurer qu'endTime et duration sont définies
    if (validatedData.isRunning === false && existingTimeLog.isRunning) {
      if (!updateData.endTime) {
        updateData.endTime = new Date()
      }
      if (!updateData.duration) {
        updateData.duration = calculateDuration(
          updateData.startTime || existingTimeLog.startTime,
          updateData.endTime
        )
      }
    }

    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: params.id },
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
  } catch (error) {
    console.error('Erreur lors de la mise à jour du log de temps:', error)

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

// DELETE /api/time-logs/[id] - Supprimer un log de temps
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que le log de temps appartient à l'utilisateur
    const existingTimeLog = await prisma.timeLog.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingTimeLog) {
      return NextResponse.json(
        { error: 'Log de temps introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le log de temps
    await prisma.timeLog.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Log de temps supprimé avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du log de temps:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 