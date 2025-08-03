import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/invoice-templates - Liste des templates avec filtres
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les filtres
    const where: any = {
      OR: [
        { isPublic: true }, // Templates publics (par défaut)
        { userId: user.id } // Templates personnalisés de l'utilisateur
      ]
    }

    if (category) {
      where.category = category
    }

    if (isPublic !== null) {
      delete where.OR
      where.isPublic = isPublic
      if (!isPublic) {
        where.userId = user.id
      }
    }

    // Récupérer les templates avec pagination
    const [templates, total] = await Promise.all([
      prisma.invoiceTemplate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              invoices: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { isPublic: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.invoiceTemplate.count({ where })
    ])

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des templates' },
      { status: 500 }
    )
  }
}

// POST /api/invoice-templates - Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      layout,
      elements,
      styles,
      variables,
      thumbnail
    } = body

    // Validation des champs requis
    if (!name || !layout || !elements || !styles) {
      return NextResponse.json(
        { error: 'Les champs name, layout, elements et styles sont requis' },
        { status: 400 }
      )
    }

    // Créer le template
    const template = await prisma.invoiceTemplate.create({
      data: {
        name,
        description,
        category: category || 'BUSINESS',
        layout,
        elements,
        styles,
        variables: variables || {},
        thumbnail,
        userId: user.id,
        isPublic: false,
        isDefault: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du template' },
      { status: 500 }
    )
  }
} 