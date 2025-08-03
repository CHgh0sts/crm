import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateNoteSchema = z.object({
  title: z.string().min(1, 'Le titre de la note est requis').optional(),
  content: z.string().min(1, 'Le contenu de la note est requis').optional(),
  type: z.enum(['GENERAL', 'PROJECT', 'CLIENT', 'MEETING', 'IDEA', 'TASK']).optional(),
  projectId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isMarkdown: z.boolean().optional(),
  color: z.string().optional(),
})

// GET /api/notes/[id] - Récupérer une note spécifique
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

    const note = await prisma.note.findFirst({
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

    if (!note) {
      return NextResponse.json(
        { error: 'Note introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Erreur lors de la récupération de la note:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/notes/[id] - Mettre à jour une note
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

    // Vérifier que la note appartient à l'utilisateur
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)

    const updateData: any = {}

    // Copier les champs simples
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.isPinned !== undefined) updateData.isPinned = validatedData.isPinned
    if (validatedData.isArchived !== undefined) updateData.isArchived = validatedData.isArchived
    if (validatedData.isMarkdown !== undefined) updateData.isMarkdown = validatedData.isMarkdown
    if (validatedData.color !== undefined) updateData.color = validatedData.color

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

    // Gérer le client
    if (validatedData.clientId !== undefined) {
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
      updateData.clientId = validatedData.clientId
    }

    // Gérer la tâche
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

    const updatedNote = await prisma.note.update({
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

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la note:', error)

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

// DELETE /api/notes/[id] - Supprimer une note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la note appartient à l'utilisateur
    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note introuvable' },
        { status: 404 }
      )
    }

    // Supprimer la note
    await prisma.note.delete({
      where: { id: id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Note supprimée avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la note:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 