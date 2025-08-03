import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createNoteSchema = z.object({
  title: z.string().min(1, 'Le titre de la note est requis'),
  content: z.string().min(1, 'Le contenu de la note est requis'),
  type: z.enum(['GENERAL', 'PROJECT', 'CLIENT', 'MEETING', 'IDEA', 'TASK']).default('GENERAL'),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  taskId: z.string().optional(),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
})

const updateNoteSchema = z.object({
  title: z.string().min(1, 'Le titre de la note est requis').optional(),
  content: z.string().min(1, 'Le contenu de la note est requis').optional(),
  type: z.enum(['GENERAL', 'PROJECT', 'CLIENT', 'MEETING', 'IDEA', 'TASK']).optional(),
  projectId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/notes - Récupérer toutes les notes de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const projectId = searchParams.get('projectId')
    const clientId = searchParams.get('clientId')
    const taskId = searchParams.get('taskId')
    const isPinned = searchParams.get('isPinned')
    const isArchived = searchParams.get('isArchived')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (type) {
      where.type = type
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (taskId) {
      where.taskId = taskId
    }

    if (isPinned !== null) {
      where.isPinned = isPinned === 'true'
    }

    if (isArchived !== null) {
      where.isArchived = isArchived === 'true'
    } else {
      // Par défaut, ne pas afficher les notes archivées
      where.isArchived = false
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
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
          client: {
            select: {
              id: true,
              name: true,
              company: true,
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
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ])

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/notes - Créer une nouvelle note
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

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

    // Vérifier le client si spécifié
    if (validatedData.clientId) {
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

    // Créer la note
    const note = await prisma.note.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        projectId: validatedData.projectId,
        clientId: validatedData.clientId,
        taskId: validatedData.taskId,
        userId: user.id,
        isPinned: validatedData.isPinned,
        isArchived: validatedData.isArchived,
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
        client: {
          select: {
            id: true,
            name: true,
            company: true,
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

    // Gérer les tags si fournis (pour une implémentation future)
    // TODO: Implémenter la logique des tags si nécessaire

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la note:', error)

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