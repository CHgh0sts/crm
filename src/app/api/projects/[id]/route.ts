import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  color: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.number().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  clientId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
})

// GET /api/projects/[id] - Récupérer un projet spécifique
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

    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tasks: {
          include: {
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
          },
          orderBy: {
            position: 'asc',
          },
        },
        timeLogs: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 10,
        },
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
        },
        invoices: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            dueDate: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        quotes: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
            validUntil: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            tasks: true,
            timeLogs: true,
            notes: true,
            invoices: true,
            quotes: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projet introuvable' },
        { status: 404 }
      )
    }

    // Calculer les statistiques du projet
    const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length
    const totalTimeSpent = project.timeLogs.reduce((total, log) => total + (log.duration || 0), 0)
    const totalRevenue = project.invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((total, invoice) => total + invoice.total, 0)

    const projectWithStats = {
      ...project,
      stats: {
        tasksCount: project._count.tasks,
        completedTasks,
        completionRate: project._count.tasks > 0 ? Math.round((completedTasks / project._count.tasks) * 100) : 0,
        totalTimeSpent, // en minutes
        totalTimeSpentHours: Math.round(totalTimeSpent / 60 * 100) / 100,
        timeLogsCount: project._count.timeLogs,
        notesCount: project._count.notes,
        invoicesCount: project._count.invoices,
        quotesCount: project._count.quotes,
        totalRevenue,
      },
    }

    return NextResponse.json(projectWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Mettre à jour un projet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Récupérer userId depuis l'authentification
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le projet appartient à l'utilisateur
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        userId,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projet introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const updateData: any = {}

    // Copier les champs simples
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.budget !== undefined) updateData.budget = validatedData.budget
    if (validatedData.progress !== undefined) updateData.progress = validatedData.progress
    if (validatedData.isArchived !== undefined) updateData.isArchived = validatedData.isArchived

    // Gérer les dates
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    // Gérer le client
    if (validatedData.clientId !== undefined) {
      if (validatedData.clientId) {
        const client = await prisma.client.findFirst({
          where: {
            id: validatedData.clientId,
            userId,
          },
        })

        if (!client) {
          return NextResponse.json(
            { error: 'Client introuvable' },
            { status: 404 }
          )
        }
      }
      updateData.clientId = validatedData.clientId
    }

    // Gérer la catégorie
    if (validatedData.categoryId !== undefined) {
      if (validatedData.categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: validatedData.categoryId,
            userId,
          },
        })

        if (!category) {
          return NextResponse.json(
            { error: 'Catégorie introuvable' },
            { status: 404 }
          )
        }
      }
      updateData.categoryId = validatedData.categoryId
    }

    const updatedProject = await prisma.project.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            timeLogs: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error)

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

// DELETE /api/projects/[id] - Supprimer un projet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Récupérer userId depuis l'authentification
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le projet appartient à l'utilisateur
    const existingProject = await prisma.project.findFirst({
      where: {
        id: id,
        userId,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Projet introuvable' },
        { status: 404 }
      )
    }

    // Option 1: Archiver au lieu de supprimer (recommandé)
    const { searchParams } = new URL(request.url)
    const forceDelete = searchParams.get('force') === 'true'

    if (forceDelete) {
      // Suppression définitive (attention aux contraintes de clés étrangères)
      await prisma.project.delete({
        where: { id: id },
      })
    } else {
      // Archivage (recommandé)
      await prisma.project.update({
        where: { id: id },
        data: {
          isArchived: true,
          updatedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: forceDelete ? 'Projet supprimé définitivement' : 'Projet archivé' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 