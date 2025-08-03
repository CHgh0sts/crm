import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Schema de validation pour créer une automatisation
const createAutomationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  type: z.enum([
    'EMAIL_REMINDER',
    'TASK_CREATION', 
    'STATUS_UPDATE',
    'REPORT_GENERATION',
    'CLIENT_FOLLOW_UP',
    'INVOICE_REMINDER',
    'BACKUP_DATA',
    'NOTIFICATION_SEND',
    'PROJECT_ARCHIVE',
    'CLIENT_CHECK_IN',
    'DEADLINE_ALERT',
    'WEEKLY_SUMMARY'
  ]),
  isActive: z.boolean().default(true),
  scheduleType: z.enum([
    'ONCE',
    'DAILY',
    'WEEKLY', 
    'MONTHLY',
    'YEARLY',
    'INTERVAL',
    'CUSTOM_CRON'
  ]),
  scheduleTime: z.string().optional(),
  scheduleDayOfMonth: z.number().min(1).max(31).optional(),
  scheduleDayOfWeek: z.number().min(0).max(6).optional(),
  scheduleInterval: z.number().min(1).optional(),
  customCronExpression: z.string().optional(),
  config: z.record(z.string(), z.any()),
  conditions: z.record(z.string(), z.any()).optional(),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    recipientType: z.enum(['CUSTOM', 'CLIENT', 'TEAM', 'PROJECT_MEMBERS']).default('CUSTOM')
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as any
    const isActiveParam = searchParams.get('isActive')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }
    
    if (type) {
      where.type = type
    }
    
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }

    const [automations, totalCount] = await Promise.all([
      prisma.automation.findMany({
        where,
        include: {
          recipients: true,
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 5 // Les 5 dernières exécutions
          },
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.automation.count({ where })
    ])

    const pagination = {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }

    return NextResponse.json({
      automations,
      pagination
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des automatisations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des automatisations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAutomationSchema.parse(body)

    // Calculer la prochaine exécution
    const nextExecutionAt = calculateNextExecution(validatedData)

    const automation = await prisma.automation.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        isActive: validatedData.isActive,
        scheduleType: validatedData.scheduleType,
        scheduleTime: validatedData.scheduleTime,
        scheduleDayOfMonth: validatedData.scheduleDayOfMonth,
        scheduleDayOfWeek: validatedData.scheduleDayOfWeek,
        scheduleInterval: validatedData.scheduleInterval,
        customCronExpression: validatedData.customCronExpression,
        config: validatedData.config as any,
        conditions: validatedData.conditions as any,
        nextExecutionAt,
        userId: user.id,
        recipients: {
          create: validatedData.recipients?.map(recipient => ({
            email: recipient.email,
            name: recipient.name,
            recipientType: recipient.recipientType
          })) || []
        }
      },
      include: {
        recipients: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(automation, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la création de l\'automatisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'automatisation' },
      { status: 500 }
    )
  }
}

// Fonction pour calculer la prochaine exécution
function calculateNextExecution(automation: any): Date | null {
  if (!automation.isActive) return null

  const now = new Date()
  const nextExecution = new Date()

  switch (automation.scheduleType) {
    case 'ONCE':
      // Pour une exécution unique, on utilise la date/heure spécifiée
      if (automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        nextExecution.setHours(hours, minutes, 0, 0)
        
        // Si l'heure est passée de moins de 5 minutes, exécuter immédiatement
        const diffInMinutes = (now.getTime() - nextExecution.getTime()) / (1000 * 60)
        
        if (diffInMinutes > 0 && diffInMinutes <= 5) {
          // Exécuter immédiatement si dans les 5 minutes qui suivent
          return now
        } else if (nextExecution <= now) {
          // Si plus de 5 minutes sont passées, programmer pour demain
          nextExecution.setDate(nextExecution.getDate() + 1)
        }
        // Sinon l'heure n'est pas encore passée, programmer pour aujourd'hui
      }
      break

    case 'DAILY':
      if (automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        nextExecution.setHours(hours, minutes, 0, 0)
        
        // Pour les automatisations quotidiennes, si l'heure est passée, programmer pour demain
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1)
        }
      }
      break

    case 'WEEKLY':
      if (automation.scheduleDayOfWeek !== undefined && automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        const dayOfWeek = automation.scheduleDayOfWeek
        const currentDayOfWeek = nextExecution.getDay()
        
        let daysUntilNext = dayOfWeek - currentDayOfWeek
        if (daysUntilNext <= 0) daysUntilNext += 7
        
        nextExecution.setDate(nextExecution.getDate() + daysUntilNext)
        nextExecution.setHours(hours, minutes, 0, 0)
      }
      break

    case 'MONTHLY':
      if (automation.scheduleDayOfMonth && automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        nextExecution.setDate(automation.scheduleDayOfMonth)
        nextExecution.setHours(hours, minutes, 0, 0)
        
        if (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 1)
        }
      }
      break

    case 'INTERVAL':
      if (automation.scheduleInterval) {
        nextExecution.setTime(now.getTime() + automation.scheduleInterval * 60 * 1000) // Interval en minutes
      }
      break

    default:
      return null
  }

  return nextExecution
} 