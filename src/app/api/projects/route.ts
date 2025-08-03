import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  color: z.string().default('#3B82F6'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  clientId: z.string().optional(),
  categoryId: z.string().optional(),
})

// GET /api/projects - Récupérer tous les projets de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
      isArchived: false,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
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
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              timeLogs: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    // Calculer les statistiques pour chaque projet
    const projectsWithStats = projects.map(project => ({
      ...project,
      tasksCount: project._count.tasks,
      completedTasks: project.tasks.filter(task => task.status === 'COMPLETED').length,
      timeLogsCount: project._count.timeLogs,
    }))

    return NextResponse.json({
      projects: projectsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const projectData: any = {
      name: validatedData.name,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      color: validatedData.color,
      budget: validatedData.budget,
      userId: user.id,
    }

    if (validatedData.startDate) {
      projectData.startDate = new Date(validatedData.startDate)
    }

    if (validatedData.endDate) {
      projectData.endDate = new Date(validatedData.endDate)
    }

    if (validatedData.clientId) {
      // Vérifier que le client appartient à l'utilisateur
      const client = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
          userId: user.id,
        },
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client introuvable' },
          { status: 404 }
        )
      }

      projectData.clientId = validatedData.clientId
    }

    if (validatedData.categoryId) {
      // Vérifier que la catégorie appartient à l'utilisateur
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          userId: user.id,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Catégorie introuvable' },
          { status: 404 }
        )
      }

      projectData.categoryId = validatedData.categoryId
    }

    const project = await prisma.project.create({
      data: projectData,
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

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error)

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