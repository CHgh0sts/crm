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

const updateInvoiceSchema = z.object({
  title: z.string().min(1, 'Le titre de la facture est requis').optional(),
  clientId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  issueDate: z.string().transform((date) => new Date(date)).optional(),
  dueDate: z.string().transform((date) => new Date(date)).optional(),
  paidDate: z.string().transform((date) => new Date(date)).nullable().optional(),
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  taxRate: z.number().min(0).max(100).optional(),
})

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

// GET /api/invoices/[id] - Récupérer une facture spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
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
            color: true,
          },
        },
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Mettre à jour une facture
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que la facture appartient à l'utilisateur
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        items: true,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateInvoiceSchema.parse(body)

    const updateData: any = {}

    // Copier les champs simples
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.issueDate !== undefined) updateData.issueDate = validatedData.issueDate
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate
    if (validatedData.paidDate !== undefined) {
      updateData.paidDate = validatedData.paidDate
      // Si une date de paiement est définie, mettre le statut à PAID
      if (validatedData.paidDate && existingInvoice.status !== 'PAID') {
        updateData.status = 'PAID'
      }
    }
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.taxRate !== undefined) updateData.taxRate = validatedData.taxRate

    // Gérer le client
    if (validatedData.clientId !== undefined) {
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

      updateData.clientId = validatedData.clientId
    }

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

    // Gérer les articles si fournis
    if (validatedData.items !== undefined) {
      // Calculer les nouveaux totaux
      const totals = calculateInvoiceTotals(validatedData.items, validatedData.taxRate || existingInvoice.taxRate)
      
      updateData.subtotal = totals.subtotal
      updateData.taxAmount = totals.taxAmount
      updateData.total = totals.total

      // Supprimer les anciens articles et créer les nouveaux
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })

      updateData.items = {
        create: validatedData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      }
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
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
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error)

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

// DELETE /api/invoices/[id] - Supprimer une facture
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que la facture appartient à l'utilisateur
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que la facture peut être supprimée (pas encore payée)
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une facture déjà payée' },
        { status: 400 }
      )
    }

    // Supprimer la facture (les articles seront supprimés en cascade)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Facture supprimée avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 