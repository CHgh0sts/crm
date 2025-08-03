import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Vérification des automatisations à exécuter...')
    
    const now = new Date()
    console.log(`⏰ Heure actuelle: ${now.toISOString()}`)
    
    // Récupérer toutes les automatisations actives et filtrer côté JavaScript
    // pour éviter les problèmes de timezone avec Prisma/SQLite
    const allActiveAutomations = await prisma.automation.findMany({
      where: {
        isActive: true,
        nextExecutionAt: {
          not: null
        }
      },
      include: {
        recipients: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    // Filtrer côté JavaScript pour plus de fiabilité
    const automationsToExecute = allActiveAutomations.filter(automation => {
      if (!automation.nextExecutionAt) return false
      const shouldExecute = automation.nextExecutionAt <= now
      console.log(`📅 ${automation.name}: ${automation.nextExecutionAt.toISOString()} <= ${now.toISOString()} = ${shouldExecute}`)
      return shouldExecute
    })

    console.log(`📋 ${automationsToExecute.length} automatisation(s) à exécuter`)

    const results = []

    for (const automation of automationsToExecute) {
      try {
        console.log(`⚡ Exécution de "${automation.name}" (${automation.type})`)
        
        // VÉRIFICATION SUPPLÉMENTAIRE : vérifier si l'automatisation n'a pas déjà été exécutée récemment
        if (automation.scheduleType === 'ONCE' && automation.lastExecutedAt) {
          // Vérifier si l'automatisation a été exécutée dans les dernières 24 heures
          const lastExecution = new Date(automation.lastExecutedAt)
          const hoursSinceLastExecution = (now.getTime() - lastExecution.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceLastExecution < 24) {
            console.log(`⚠️ Automatisation "${automation.name}" de type ONCE déjà exécutée récemment (${Math.round(hoursSinceLastExecution)}h). Désactivation...`)
            
            // Désactiver immédiatement l'automatisation ONCE qui a déjà été exécutée récemment
            await prisma.automation.update({
              where: { id: automation.id },
              data: {
                isActive: false,
                nextExecutionAt: null
              }
            })
            
            results.push({
              automationId: automation.id,
              name: automation.name,
              status: 'SKIPPED',
              reason: `Automatisation ONCE déjà exécutée il y a ${Math.round(hoursSinceLastExecution)}h`
            })
            continue
          } else {
            console.log(`🔄 Automatisation "${automation.name}" de type ONCE peut être exécutée (dernière exécution il y a ${Math.round(hoursSinceLastExecution)}h)`)
          }
        }
        
        // Créer un enregistrement d'exécution
        const execution = await prisma.automationExecution.create({
          data: {
            automationId: automation.id,
            status: 'RUNNING',
            startedAt: new Date()
          }
        })

        try {
          // Exécuter l'automatisation
          const result = await executeAutomation(automation, {
            id: automation.user.id,
            email: automation.user.email,
            name: automation.user.firstName && automation.user.lastName 
              ? `${automation.user.firstName} ${automation.user.lastName}` 
              : automation.user.email
          })

          // Marquer l'exécution comme réussie
          await prisma.automationExecution.update({
            where: { id: execution.id },
            data: {
              status: 'SUCCESS',
              completedAt: new Date(),
              result: result as any
            }
          })

          // Calculer la prochaine exécution
          const nextExecutionAt = calculateNextExecution(automation)
          
          // PROTECTION SPÉCIALE POUR LES AUTOMATISATIONS ONCE
          const updateData: any = {
            totalExecutions: { increment: 1 },
            successfulExecutions: { increment: 1 },
            lastExecutedAt: new Date(),
            nextExecutionAt
          }
          
          // Désactiver immédiatement les automatisations ONCE après exécution
          if (automation.scheduleType === 'ONCE') {
            updateData.isActive = false
            updateData.nextExecutionAt = null
            console.log(`🔒 Automatisation "${automation.name}" de type ONCE désactivée après exécution`)
          }

          // Mettre à jour les statistiques de l'automatisation
          await prisma.automation.update({
            where: { id: automation.id },
            data: updateData
          })

          console.log(`✅ "${automation.name}" exécutée avec succès`)
          results.push({
            automationId: automation.id,
            name: automation.name,
            status: 'SUCCESS',
            nextExecution: nextExecutionAt,
            isActiveAfter: automation.scheduleType !== 'ONCE'
          })

        } catch (error) {
          console.error(`❌ Erreur lors de l'exécution de "${automation.name}":`, error)
          
          // Marquer l'exécution comme échouée
          await prisma.automationExecution.update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              error: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          })

          // Calculer la prochaine exécution même en cas d'échec
          const nextExecutionAt = calculateNextExecution(automation)
          
          // PROTECTION SPÉCIALE POUR LES AUTOMATISATIONS ONCE MÊME EN CAS D'ÉCHEC
          const updateData: any = {
            totalExecutions: { increment: 1 },
            lastExecutedAt: new Date(),
            nextExecutionAt
          }
          
          // Désactiver immédiatement les automatisations ONCE même en cas d'échec
          if (automation.scheduleType === 'ONCE') {
            updateData.isActive = false
            updateData.nextExecutionAt = null
            console.log(`🔒 Automatisation "${automation.name}" de type ONCE désactivée après échec`)
          }

          // Mettre à jour les statistiques
          await prisma.automation.update({
            where: { id: automation.id },
            data: updateData
          })

          results.push({
            automationId: automation.id,
            name: automation.name,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            nextExecution: nextExecutionAt,
            isActiveAfter: automation.scheduleType !== 'ONCE'
          })
        }

      } catch (error) {
        console.error(`💥 Erreur critique pour "${automation.name}":`, error)
        results.push({
          automationId: automation.id,
          name: automation.name,
          status: 'CRITICAL_ERROR',
          error: error instanceof Error ? error.message : 'Erreur critique'
        })
      }
    }

    return NextResponse.json({
      message: 'Vérification terminée',
      executedCount: automationsToExecute.length,
      results
    })

  } catch (error) {
    console.error('❌ Erreur du scheduler:', error)
    return NextResponse.json(
      { error: 'Erreur du système de planification' },
      { status: 500 }
    )
  }
}

// Importer les fonctions d'exécution depuis l'autre route
async function executeAutomation(automation: any, user: any) {
  const { type, config, recipients } = automation

  switch (type) {
    case 'EMAIL_REMINDER':
      return await executeEmailReminder(automation, recipients, user)
    
    case 'TASK_CREATION':
      return await executeTaskCreation(automation, config, user)
    
    case 'STATUS_UPDATE':
      return await executeStatusUpdate(automation, config, user)
    
    case 'REPORT_GENERATION':
      return await executeReportGeneration(automation, config, user)
    
    case 'CLIENT_FOLLOW_UP':
      return await executeClientFollowUp(automation, recipients, user)
    
    case 'INVOICE_REMINDER':
      return await executeInvoiceReminder(automation, recipients, user)
    
    case 'BACKUP_DATA':
      return await executeBackupData(automation, config, user)
    
    case 'NOTIFICATION_SEND':
      return await executeNotificationSend(automation, recipients, user)
    
    case 'PROJECT_ARCHIVE':
      return await executeProjectArchive(automation, config, user)
    
    case 'CLIENT_CHECK_IN':
      return await executeClientCheckIn(automation, recipients, user)
    
    case 'DEADLINE_ALERT':
      return await executeDeadlineAlert(automation, recipients, user)
    
    case 'WEEKLY_SUMMARY':
      return await executeWeeklySummary(automation, recipients, user)
    
    default:
      throw new Error(`Type d'automatisation non supporté: ${type}`)
  }
}

// Implémentations simplifiées des automatisations
async function executeEmailReminder(automation: any, recipients: any[], user: any) {
  const { config } = automation
  const emailsSent = []

  try {
    const { sendEmail } = await import('@/lib/email')

    for (const recipient of recipients) {
      try {
        const subject = config.subject || 'Rappel automatique'
        const message = config.message || 'Ceci est un rappel automatique'
        
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Cet email a été envoyé automatiquement par votre système CRM.
            </p>
          </div>
        `

        const result = await sendEmail({
          to: recipient.email,
          toName: recipient.name,
          subject: subject,
          htmlContent: htmlContent,
          textContent: message,
          userId: user.id,
        })

        if (result.success) {
          console.log(`✅ Email planifié envoyé à ${recipient.email}`)
          emailsSent.push({
            email: recipient.email,
            status: 'sent',
            emailId: result.emailId,
            timestamp: new Date()
          })
        } else {
          throw new Error(result.error || 'Erreur inconnue')
        }
        
      } catch (error) {
        console.error(`❌ Erreur envoi email planifié à ${recipient.email}:`, error)
        emailsSent.push({
          email: recipient.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          timestamp: new Date()
        })
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation du module email:', error)
    throw new Error('Service email non disponible')
  }

  return {
    type: 'EMAIL_REMINDER',
    emailsSent: emailsSent.filter(e => e.status === 'sent').length,
    emailsFailed: emailsSent.filter(e => e.status === 'failed').length,
    details: emailsSent
  }
}

async function executeTaskCreation(automation: any, config: any, user: any) {
  return { type: 'TASK_CREATION', message: 'Création de tâches simulée' }
}

async function executeStatusUpdate(automation: any, config: any, user: any) {
  return { type: 'STATUS_UPDATE', message: 'Mise à jour de statuts simulée' }
}

async function executeReportGeneration(automation: any, config: any, user: any) {
  return { type: 'REPORT_GENERATION', message: 'Génération de rapports simulée' }
}

async function executeClientFollowUp(automation: any, recipients: any[], user: any) {
  return { type: 'CLIENT_FOLLOW_UP', message: 'Suivi client simulé' }
}

async function executeInvoiceReminder(automation: any, recipients: any[], user: any) {
  return { type: 'INVOICE_REMINDER', message: 'Rappel de facture simulé' }
}

async function executeBackupData(automation: any, config: any, user: any) {
  return { type: 'BACKUP_DATA', message: 'Sauvegarde simulée' }
}

async function executeNotificationSend(automation: any, recipients: any[], user: any) {
  return { type: 'NOTIFICATION_SEND', message: 'Notification simulée' }
}

async function executeProjectArchive(automation: any, config: any, user: any) {
  return { type: 'PROJECT_ARCHIVE', message: 'Archivage simulé' }
}

async function executeClientCheckIn(automation: any, recipients: any[], user: any) {
  return { type: 'CLIENT_CHECK_IN', message: 'Vérification client simulée' }
}

async function executeDeadlineAlert(automation: any, recipients: any[], user: any) {
  return { type: 'DEADLINE_ALERT', message: 'Alerte d\'échéance simulée' }
}

async function executeWeeklySummary(automation: any, recipients: any[], user: any) {
  return { type: 'WEEKLY_SUMMARY', message: 'Résumé hebdomadaire simulé' }
}

// Fonction pour calculer la prochaine exécution
function calculateNextExecution(automation: any): Date | null {
  if (!automation.isActive) return null

  const now = new Date()
  const nextExecution = new Date()

  switch (automation.scheduleType) {
    case 'ONCE':
      // Pour une exécution unique, après exécution, ne pas planifier de nouvelle exécution
      return null

    case 'DAILY':
      if (automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        nextExecution.setHours(hours, minutes, 0, 0)
        nextExecution.setDate(nextExecution.getDate() + 1) // Jour suivant
      }
      break

    case 'WEEKLY':
      if (automation.scheduleDayOfWeek !== undefined && automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        const dayOfWeek = automation.scheduleDayOfWeek
        
        nextExecution.setHours(hours, minutes, 0, 0)
        nextExecution.setDate(nextExecution.getDate() + 7) // Semaine suivante
      }
      break

    case 'MONTHLY':
      if (automation.scheduleDayOfMonth && automation.scheduleTime) {
        const [hours, minutes] = automation.scheduleTime.split(':').map(Number)
        nextExecution.setMonth(nextExecution.getMonth() + 1) // Mois suivant
        nextExecution.setDate(automation.scheduleDayOfMonth)
        nextExecution.setHours(hours, minutes, 0, 0)
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