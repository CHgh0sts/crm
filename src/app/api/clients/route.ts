import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createClientSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis'),
  company: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).default('ACTIVE'),
})

// GET /api/clients - Récupérer tous les clients de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = searchParams.get('limit')
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam || '20')
    const skip = limit ? (page - 1) * limit : 0

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          contacts: {
            orderBy: {
              isPrimary: 'desc',
            },
          },
          interactions: {
            orderBy: {
              date: 'desc',
            },
            take: 5,
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
            where: {
              isArchived: false,
            },
          },
          invoices: {
            select: {
              id: true,
              number: true,
              status: true,
              total: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
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
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        ...(limit ? { take: limit } : {}),
      }),
      prisma.client.count({ where }),
    ])

    // Calculer le revenu total pour chaque client
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const totalRevenue = await prisma.invoice.aggregate({
          where: {
            clientId: client.id,
            status: 'PAID',
          },
          _sum: {
            total: true,
          },
        })

        const lastInteraction = await prisma.interaction.findFirst({
          where: {
            clientId: client.id,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          ...client,
          stats: {
            totalRevenue: totalRevenue._sum.total || 0,
            contactsCount: client._count.contacts,
            interactionsCount: client._count.interactions,
            projectsCount: client._count.projects,
            invoicesCount: client._count.invoices,
            quotesCount: client._count.quotes,
            lastInteraction: lastInteraction?.date || null,
          },
        }
      })
    )

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / limit) : 1,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Debug logs
    console.log('🔍 Debug création client:')
    console.log('- userId:', user.id)
    console.log('- clientData:', JSON.stringify(validatedData, null, 2))

    const clientData: any = {
      name: validatedData.name,
      company: validatedData.company,
      email: validatedData.email || null,
      phone: validatedData.phone,
      address: validatedData.address,
      city: validatedData.city,
      postalCode: validatedData.postalCode,
      country: validatedData.country,
      website: validatedData.website || null,
      notes: validatedData.notes,
      status: validatedData.status,
      userId: user.id,
    }

    const client = await prisma.client.create({
      data: clientData,
      include: {
        contacts: true,
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

    console.log('✅ Client créé avec succès:')
    console.log('- ID:', client.id)
    console.log('- userId:', client.userId)

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)

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