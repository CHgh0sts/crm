import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// POST /api/invoice-templates/[id]/duplicate - Dupliquer un template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le template original
    const originalTemplate = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { userId: user.id }
        ]
      }
    })

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name } = body

    // Créer une copie du template
    const duplicatedTemplate = await prisma.invoiceTemplate.create({
      data: {
        name: name || `Copie de ${originalTemplate.name}`,
        description: `Copie de : ${originalTemplate.description || originalTemplate.name}`,
        category: originalTemplate.category,
        layout: originalTemplate.layout as Prisma.InputJsonValue,
        elements: originalTemplate.elements as Prisma.InputJsonValue,
        styles: originalTemplate.styles as Prisma.InputJsonValue,
        variables: originalTemplate.variables as Prisma.InputJsonValue,
        thumbnail: originalTemplate.thumbnail,
        userId: user.id,
        isPublic: false,
        isDefault: false,
        version: '1.0.0'
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

    return NextResponse.json(duplicatedTemplate, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la duplication du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la duplication du template' },
      { status: 500 }
    )
  }
} 