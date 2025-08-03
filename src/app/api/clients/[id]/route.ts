import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateClientSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis').optional(),
  company: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).optional(),
})

// GET /api/clients/[id] - Récupérer un client spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const client = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        contacts: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' },
          ],
        },
        interactions: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            color: true,
            progress: true,
            createdAt: true,
            updatedAt: true,
          },
          where: {
            isArchived: false,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        invoices: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            total: true,
            issueDate: true,
            dueDate: true,
            paidDate: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        quotes: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            total: true,
            validUntil: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            contacts: true,
            interactions: true,
            projects: true,
            invoices: true,
            quotes: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }

    // Calculer les statistiques détaillées
    const [totalRevenue, paidInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          clientId: client.id,
          status: 'PAID',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.invoice.count({
        where: {
          clientId: client.id,
          status: 'PAID',
        },
      }),
      prisma.invoice.count({
        where: {
          clientId: client.id,
          status: 'OVERDUE',
        },
      }),
    ])

    const lastInteraction = client.interactions[0] || null
    const primaryContact = client.contacts.find(contact => contact.isPrimary) || client.contacts[0] || null

    const clientWithStats = {
      ...client,
      stats: {
        totalRevenue: totalRevenue._sum.total || 0,
        contactsCount: client._count.contacts,
        interactionsCount: client._count.interactions,
        projectsCount: client._count.projects,
        invoicesCount: client._count.invoices,
        quotesCount: client._count.quotes,
        paidInvoices,
        overdueInvoices,
        lastInteraction: lastInteraction?.date || null,
        primaryContact,
      },
    }

    return NextResponse.json(clientWithStats)
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Mettre à jour un client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le client appartient à l'utilisateur
    const existingClient = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    const updateData: any = {}

    // Copier les champs modifiés
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.company !== undefined) updateData.company = validatedData.company
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode
    if (validatedData.country !== undefined) updateData.country = validatedData.country
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        contacts: {
          orderBy: {
            isPrimary: 'desc',
          },
        },
        _count: {
          select: {
            contacts: true,
            interactions: true,
            projects: true,
            invoices: true,
            quotes: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error)

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

// DELETE /api/clients/[id] - Supprimer un client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le client appartient à l'utilisateur
    const existingClient = await prisma.client.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        projects: {
          where: {
            isArchived: false,
          },
        },
        invoices: true,
        quotes: true,
      },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des dépendances
    const hasActiveProjects = existingClient.projects.length > 0
    const hasInvoices = existingClient.invoices.length > 0
    const hasQuotes = existingClient.quotes.length > 0

    if (hasActiveProjects || hasInvoices || hasQuotes) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce client car il a des projets, factures ou devis associés',
          dependencies: {
            projects: existingClient.projects.length,
            invoices: existingClient.invoices.length,
            quotes: existingClient.quotes.length,
          }
        },
        { status: 400 }
      )
    }

    // Supprimer le client (les contacts et interactions seront supprimés en cascade)
    await prisma.client.delete({
      where: { id: id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Client supprimé avec succès' 
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 