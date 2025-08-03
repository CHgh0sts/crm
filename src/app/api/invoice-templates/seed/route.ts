import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { defaultTemplates } from '@/lib/default-templates'
import { Prisma } from '@/generated/prisma'

// POST /api/invoice-templates/seed - Initialiser les templates par défaut
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si les templates par défaut existent déjà
    const existingDefaultTemplates = await prisma.invoiceTemplate.findMany({
      where: { isDefault: true, isPublic: true }
    })

    if (existingDefaultTemplates.length > 0) {
      return NextResponse.json({
        message: 'Les templates par défaut existent déjà',
        count: existingDefaultTemplates.length
      })
    }

    // Insérer les templates par défaut
    const createdTemplates = []
    
    for (const template of defaultTemplates) {
      const createdTemplate = await prisma.invoiceTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          isDefault: template.isDefault,
          isPublic: template.isPublic,
          layout: template.layout as Prisma.InputJsonValue,
          elements: template.elements as Prisma.InputJsonValue,
          styles: template.styles as Prisma.InputJsonValue,
          variables: template.variables as Prisma.InputJsonValue,
          userId: null, // Templates par défaut n'appartiennent à personne
          version: '1.0.0'
        }
      })
      
      createdTemplates.push(createdTemplate)
    }

    return NextResponse.json({
      message: 'Templates par défaut créés avec succès',
      count: createdTemplates.length,
      templates: createdTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category
      }))
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création des templates par défaut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création des templates par défaut' },
      { status: 500 }
    )
  }
}

// GET /api/invoice-templates/seed - Vérifier le statut des templates par défaut
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const defaultTemplatesCount = await prisma.invoiceTemplate.count({
      where: { isDefault: true, isPublic: true }
    })

    return NextResponse.json({
      hasDefaultTemplates: defaultTemplatesCount > 0,
      count: defaultTemplatesCount,
      expectedCount: defaultTemplates.length
    })

  } catch (error) {
    console.error('Erreur lors de la vérification des templates par défaut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
} 