import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/invoice-templates/[id] - Récupérer un template par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const template = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { userId: user.id }
        ]
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

    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)

  } catch (error) {
    console.error('Erreur lors de la récupération du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du template' },
      { status: 500 }
    )
  }
}

// PUT /api/invoice-templates/[id] - Mettre à jour un template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que le template existe et appartient à l'utilisateur
    const existingTemplate = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        userId: user.id // Seuls les templates personnalisés peuvent être modifiés
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template non trouvé ou non autorisé' },
        { status: 404 }
      )
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

    // Mettre à jour le template
    const updatedTemplate = await prisma.invoiceTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(layout !== undefined && { layout }),
        ...(elements !== undefined && { elements }),
        ...(styles !== undefined && { styles }),
        ...(variables !== undefined && { variables }),
        ...(thumbnail !== undefined && { thumbnail }),
        version: `${parseFloat(existingTemplate.version) + 0.1}`.substring(0, 5) // Incrémenter la version
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

    return NextResponse.json(updatedTemplate)

  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du template' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoice-templates/[id] - Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que le template existe et appartient à l'utilisateur
    const existingTemplate = await prisma.invoiceTemplate.findFirst({
      where: {
        id,
        userId: user.id // Seuls les templates personnalisés peuvent être supprimés
      },
      include: {
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des factures qui utilisent ce template
    if (existingTemplate._count.invoices > 0) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer ce template car ${existingTemplate._count.invoices} facture(s) l'utilisent` 
        },
        { status: 400 }
      )
    }

    // Supprimer le template
    await prisma.invoiceTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du template' },
      { status: 500 }
    )
  }
} 