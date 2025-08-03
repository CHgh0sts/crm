import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const automationId = searchParams.get('automationId')
    const status = searchParams.get('status')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const skip = (page - 1) * limit

    // Construction des filtres
    const where: any = {
      automation: {
        userId: user.id
      }
    }

    if (automationId) {
      where.automationId = automationId
    }

    if (status) {
      where.status = status
    }

    const [executions, totalCount] = await Promise.all([
      prisma.automationExecution.findMany({
        where,
        include: {
          automation: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.automationExecution.count({ where })
    ])

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }

    return NextResponse.json({
      executions,
      pagination
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
} 