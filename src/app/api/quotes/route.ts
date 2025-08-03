import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

const prisma = new PrismaClient()

// Schéma de validation pour créer un devis
const createQuoteSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
  projectId: z.string().optional(),
  validUntil: z.string().min(1, 'La date d\'expiration est requise'),
  taxRate: z.number().min(0).max(100).default(20),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'La description est requise'),
    quantity: z.number().min(0.01, 'La quantité doit être positive'),
    unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
  })).optional().default([]),
})

// GET - Récupérer tous les devis
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: any = {
      userId: user.id,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    const quotes = await prisma.quote.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const quotesWithStats = quotes.map(quote => ({
      ...quote,
      stats: {
        itemsCount: quote._count.items,
        emailsCount: quote._count.emails,
      },
    }))

    return NextResponse.json(quotesWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau devis
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createQuoteSchema.parse(body)

    // Debug logs
    console.log('🔍 Debug création devis:')
    console.log('- userId:', user.id)
    console.log('- clientId:', validatedData.clientId)
    console.log('- body:', JSON.stringify(body, null, 2))

    // Vérifier que le client existe
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        userId: user.id,
      },
    })

    console.log('- Client trouvé:', client ? 'OUI' : 'NON')

    if (!client) {
      // Chercher le client sans userId pour debug
      const clientWithoutUserId = await prisma.client.findFirst({
        where: {
          id: validatedData.clientId,
        },
      })
      console.log('- Client sans userId:', clientWithoutUserId ? `EXISTE avec userId: ${clientWithoutUserId.userId}` : 'N\'EXISTE PAS')
      
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le projet existe (si fourni)
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

    // Générer le numéro de devis
    const latestQuote = await prisma.quote.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    })

    const nextNumber = latestQuote 
      ? parseInt(latestQuote.number.split('-')[1]) + 1 
      : 1

    const quoteNumber = `DEVIS-${String(nextNumber).padStart(4, '0')}`

    // Calculer les montants
    const subtotal = validatedData.items?.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    ) || 0
    const taxAmount = (subtotal * validatedData.taxRate) / 100
    const total = subtotal + taxAmount

    // Créer le devis avec ses éléments
    const createData: any = {
      number: quoteNumber,
      title: validatedData.title,
      description: validatedData.description,
      clientId: validatedData.clientId,
      projectId: validatedData.projectId || null,
      userId: user.id,
      validUntil: new Date(validatedData.validUntil),
      taxRate: validatedData.taxRate,
      currency: validatedData.currency,
      notes: validatedData.notes,
      subtotal,
      taxAmount,
      total,
    }

    // Ajouter les éléments seulement s'il y en a
    if (validatedData.items && validatedData.items.length > 0) {
      createData.items = {
        create: validatedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      }
    }

    const quote = await prisma.quote.create({
      data: createData,
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

    return NextResponse.json(quoteWithStats, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la création du devis:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 