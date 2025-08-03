import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createContactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

// GET /api/clients/[id]/contacts - Récupérer tous les contacts d'un client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: clientId } = await params

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    const contacts = await prisma.contact.findMany({
      where: {
        clientId,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[id]/contacts - Créer un nouveau contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id: clientId } = await params

    // Vérifier que le client appartient à l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Si ce contact est défini comme principal, retirer le statut principal des autres
    if (validatedData.isPrimary) {
      await prisma.contact.updateMany({
        where: {
          clientId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    const contactData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      position: validatedData.position || null,
      notes: validatedData.notes || null,
      isPrimary: validatedData.isPrimary,
      clientId,
    }

    const contact = await prisma.contact.create({
      data: contactData,
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du contact:', error)

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