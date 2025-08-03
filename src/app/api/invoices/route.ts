import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'La description est requise'),
  quantity: z.number().min(0.01, 'La quantité doit être positive'),
  unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
  taxRate: z.number().min(0).max(100).default(20),
})

const createInvoiceSchema = z.object({
  title: z.string().min(1, 'Le titre de la facture est requis'),
  number: z.string().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
  projectId: z.string().optional(),
  issueDate: z.string().transform((date) => new Date(date)),
  dueDate: z.string().transform((date) => new Date(date)),
  items: z.array(invoiceItemSchema).min(1, 'Au moins un article est requis'),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  taxRate: z.number().min(0).max(100).default(20),
})

// Générer un numéro de facture automatique
async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      number: {
        startsWith: `FAC-${year}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumberPart = lastInvoice.number.split('-')[2]
    nextNumber = parseInt(lastNumberPart) + 1
  }

  return `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`
}

// Calculer les totaux d'une facture
function calculateInvoiceTotals(
  items: Array<{ quantity: number; unitPrice: number; taxRate: number }>,
  globalTaxRate: number = 20
) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  
  const taxAmount = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    return sum + (itemTotal * item.taxRate / 100)
  }, 0)

  const total = subtotal + taxAmount

  return {
    subtotal,
    taxAmount,
    total,
  }
}

// GET /api/invoices - Récupérer toutes les factures de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (projectId) {
      where.projectId = projectId
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
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
              color: true,
            },
          },
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Créer une nouvelle facture
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

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

    // Générer le numéro de facture si non fourni
    const invoiceNumber = validatedData.number || await generateInvoiceNumber(user.id)

    // Calculer les totaux
    const totals = calculateInvoiceTotals(validatedData.items, validatedData.taxRate)

    // Créer la facture avec les articles
    const invoice = await prisma.invoice.create({
      data: {
        title: validatedData.title,
        number: invoiceNumber,
        clientId: validatedData.clientId,
        projectId: validatedData.projectId,
        userId: user.id,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        status: validatedData.status,
        subtotal: totals.subtotal,
        taxRate: validatedData.taxRate,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes: validatedData.notes,
        items: {
          create: validatedData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
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
            color: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error)

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