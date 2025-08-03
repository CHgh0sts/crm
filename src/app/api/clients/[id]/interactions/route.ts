import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const interactionSchema = z.object({
  type: z.enum(['EMAIL', 'PHONE', 'MEETING', 'NOTE', 'PROPOSAL']),
  subject: z.string().min(1, 'Le sujet est requis'),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date invalide",
  }),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    const interactions = await prisma.interaction.findMany({
      where: {
        clientId: id
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Erreur lors de la récupération des interactions:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = interactionSchema.parse(body)

    const interaction = await prisma.interaction.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        clientId: id,
      }
    })

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la création de l\'interaction:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 