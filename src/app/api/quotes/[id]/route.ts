import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

const prisma = new PrismaClient()

// Schéma de validation pour mettre à jour un devis
const updateQuoteSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  validUntil: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(), // Pour les éléments existants
    description: z.string().min(1),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
  })).optional(),
})

// GET - Récupérer un devis spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    const quote = await prisma.quote.findFirst({
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
            address: true,
            city: true,
            postalCode: true,
            country: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        emails: {
          select: {
            id: true,
            subject: true,
            status: true,
            sentAt: true,
            openedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            items: true,
            emails: true,
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    const quoteWithStats = {
      ...quote,
      stats: {
        itemsCount: quote._count.items,
        emailsCount: quote._count.emails,
      },
    }

    return NextResponse.json(quoteWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un devis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Récupérer userId depuis l'authentification
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const validatedData = updateQuoteSchema.parse(body)

    // Vérifier que le devis existe et appartient à l'utilisateur
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id: id,
        userId,
      },
      include: {
        items: true,
      },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    // Mettre à jour les champs simples
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.clientId) updateData.clientId = validatedData.clientId
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId
    if (validatedData.validUntil) updateData.validUntil = new Date(validatedData.validUntil)
    if (validatedData.taxRate !== undefined) updateData.taxRate = validatedData.taxRate
    if (validatedData.currency) updateData.currency = validatedData.currency
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    // Gérer les changements de statut avec timestamps
    if (validatedData.status) {
      switch (validatedData.status) {
        case 'ACCEPTED':
          if (existingQuote.status !== 'ACCEPTED') {
            updateData.acceptedAt = new Date()
            updateData.rejectedAt = null
          }
          break
        case 'REJECTED':
          if (existingQuote.status !== 'REJECTED') {
            updateData.rejectedAt = new Date()
            updateData.acceptedAt = null
          }
          break
        default:
          // Pour les autres statuts, on garde les timestamps existants
          break
      }
    }

    // Gérer la mise à jour des éléments
    if (validatedData.items) {
      // Supprimer tous les éléments existants et les recréer
      await prisma.quoteItem.deleteMany({
        where: { quoteId: id },
      })

      // Recalculer les montants
      const subtotal = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      )
      const taxRate = validatedData.taxRate ?? existingQuote.taxRate
      const taxAmount = (subtotal * taxRate) / 100
      const total = subtotal + taxAmount

      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.total = total

      updateData.items = {
        create: validatedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      }
    }

    // Mettre à jour le devis
    const quote = await prisma.quote.update({
      where: { id: id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
        _count: {
          select: {
            items: true,
            emails: true,
          },
        },
      },
    })

    const quoteWithStats = {
      ...quote,
      stats: {
        itemsCount: quote._count.items,
        emailsCount: quote._count.emails,
      },
    }

    return NextResponse.json(quoteWithStats)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la mise à jour du devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un devis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Récupérer userId depuis l'authentification
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Vérifier que le devis existe et appartient à l'utilisateur
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id: id,
        userId,
      },
      include: {
        emails: true,
      },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des contraintes de suppression
    const hasEmails = existingQuote.emails.length > 0
    const isAccepted = existingQuote.status === 'ACCEPTED'

    if (hasEmails || isAccepted) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce devis', 
          details: {
            hasEmails,
            isAccepted,
            emailsCount: existingQuote.emails.length,
          }
        },
        { status: 400 }
      )
    }

    // Supprimer le devis (les éléments seront supprimés automatiquement via CASCADE)
    await prisma.quote.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 