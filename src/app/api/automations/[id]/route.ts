import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Schema de validation pour mettre à jour une automatisation
const updateAutomationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().nullish(),
  isActive: z.boolean().optional(),
  scheduleType: z.enum([
    'ONCE',
    'DAILY',
    'WEEKLY', 
    'MONTHLY',
    'YEARLY',
    'INTERVAL',
    'CUSTOM_CRON'
  ]).optional(),
  scheduleTime: z.string().nullish(),
  scheduleDayOfMonth: z.number().min(1).max(31).nullish(),
  scheduleDayOfWeek: z.number().min(0).max(6).nullish(),
  scheduleInterval: z.number().min(1).nullish(),
  customCronExpression: z.string().nullish(),
  config: z.record(z.string(), z.any()).default({}),
  conditions: z.record(z.string(), z.any()).nullish(),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    recipientType: z.enum(['CUSTOM', 'CLIENT', 'TEAM', 'PROJECT_MEMBERS']).default('CUSTOM')
  })).optional()
}).transform((data) => {
  // Nettoyer les données côté serveur
  const cleaned: any = { ...data }
  
  // Supprimer les valeurs null/undefined/vides pour les champs optionnels
  if (!cleaned.description?.trim()) delete cleaned.description
  if (!cleaned.scheduleTime?.trim()) delete cleaned.scheduleTime
  if (!cleaned.customCronExpression?.trim()) delete cleaned.customCronExpression
  if (cleaned.scheduleDayOfMonth === null || cleaned.scheduleDayOfMonth === undefined) delete cleaned.scheduleDayOfMonth
  if (cleaned.scheduleDayOfWeek === null || cleaned.scheduleDayOfWeek === undefined) delete cleaned.scheduleDayOfWeek
  if (cleaned.scheduleInterval === null || cleaned.scheduleInterval === undefined) delete cleaned.scheduleInterval
  if (!cleaned.conditions || Object.keys(cleaned.conditions).length === 0) delete cleaned.conditions
  
  return cleaned
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const automation = await prisma.automation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        recipients: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            executions: true
          }
        }
      }
    })

    if (!automation) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(automation)

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'automatisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'automatisation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateAutomationSchema.parse(body)

    // Vérifier que l'automatisation appartient à l'utilisateur
    const existingAutomation = await prisma.automation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        recipients: true
      }
    })

    if (!existingAutomation) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      )
    }

    // Calculer la prochaine exécution si les paramètres de planification ont changé
    let nextExecutionAt = existingAutomation.nextExecutionAt
    let resetExecutionHistory = false
    
    // LOGIQUE SPÉCIALE : Réactivation d'une automatisation ONCE
    if (validatedData.isActive === true && 
        !existingAutomation.isActive && 
        existingAutomation.scheduleType === 'ONCE' && 
        existingAutomation.lastExecutedAt) {
      
      console.log(`🔄 Réactivation d'une automatisation ONCE "${existingAutomation.name}" - Reset de l'historique d'exécution`)
      resetExecutionHistory = true
    }
    
    if (validatedData.scheduleType || validatedData.scheduleTime || validatedData.isActive !== undefined) {
      nextExecutionAt = calculateNextExecution({
        ...existingAutomation,
        ...validatedData,
        // Pour le calcul, on fait comme si l'automatisation n'avait jamais été exécutée
        lastExecutedAt: resetExecutionHistory ? null : existingAutomation.lastExecutedAt
      })
    }

    // Mettre à jour l'automatisation
    const updateData: any = {
      ...validatedData,
      config: validatedData.config as any,
      conditions: validatedData.conditions as any,
      nextExecutionAt,
      updatedAt: new Date(),
    }
    
    // RESET pour les automatisations ONCE réactivées
    if (resetExecutionHistory) {
      updateData.lastExecutedAt = null
      console.log(`✨ Automatisation ONCE "${existingAutomation.name}" réinitialisée pour nouvelle exécution`)
    }

    // Gérer les destinataires si fournis
    if (validatedData.recipients) {
      // Supprimer les anciens destinataires
      await prisma.automationRecipient.deleteMany({
        where: { automationId: id }
      })
      
      // Ajouter les nouveaux destinataires
      updateData.recipients = {
        create: validatedData.recipients.map((recipient: any) => ({
          email: recipient.email,
          name: recipient.name,
          recipientType: recipient.recipientType
        }))
      }
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: updateData,
      include: {
        recipients: true,
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json(automation)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de la mise à jour de l\'automatisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'automatisation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que l'automatisation appartient à l'utilisateur
    const existingAutomation = await prisma.automation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingAutomation) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer l'automatisation (les destinataires et exécutions seront supprimés en cascade)
    await prisma.automation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Automatisation supprimée avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'automatisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'automatisation' },
      { status: 500 }
    )
  }
}

// Fonction pour calculer la prochaine exécution (réutilisée depuis l'API principale)
function calculateNextExecution(automation: any): Date | null {
  if (!automation.isActive) return null

  const now = new Date()
  const nextExecution = new Date()

  switch (automation.scheduleType) {
    case 'ONCE':
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
        nextExecution.setTime(now.getTime() + automation.scheduleInterval * 60 * 1000)
      }
      break

    default:
      return null
  }

  return nextExecution
} 