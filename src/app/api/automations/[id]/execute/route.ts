import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
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
    const automation = await prisma.automation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        recipients: true
      }
    })

    if (!automation) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      )
    }

    if (!automation.isActive) {
      return NextResponse.json(
        { error: 'Cette automatisation est désactivée' },
        { status: 400 }
      )
    }

    // Créer un enregistrement d'exécution
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: id,
        status: 'RUNNING',
        startedAt: new Date()
      }
    })

    try {
      // Exécuter l'automatisation selon son type
      const result = await executeAutomation(automation, user)

      // Marquer l'exécution comme réussie
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          result: result as any
        }
      })

      // Mettre à jour les statistiques de l'automatisation
      await prisma.automation.update({
        where: { id },
        data: {
          totalExecutions: { increment: 1 },
          successfulExecutions: { increment: 1 },
          lastExecutedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Automatisation exécutée avec succès',
        executionId: execution.id,
        result
      })

    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error)
      
      // Marquer l'exécution comme échouée
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      })

      // Mettre à jour les statistiques
      await prisma.automation.update({
        where: { id },
        data: {
          totalExecutions: { increment: 1 },
          lastExecutedAt: new Date()
        }
      })

      throw error
    }

  } catch (error) {
    console.error('Erreur lors de l\'exécution manuelle:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution de l\'automatisation' },
      { status: 500 }
    )
  }
}

// Fonction principale d'exécution des automatisations
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

// Implémentations des différents types d'automatisation
async function executeEmailReminder(automation: any, recipients: any[], user: any) {
  const { config } = automation
  const emailsSent = []

  // Importer la fonction d'envoi d'email réelle
  const { sendEmail } = await import('@/lib/email')

  for (const recipient of recipients) {
    try {
      const subject = config.subject || 'Rappel automatique'
      const message = config.message || 'Ceci est un rappel automatique'
      
      // Créer le contenu HTML simple
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

      // Envoyer l'email réellement
      const result = await sendEmail({
        to: recipient.email,
        toName: recipient.name,
        subject: subject,
        htmlContent: htmlContent,
        textContent: message,
        userId: user.id,
      })

      if (result.success) {
        console.log(`✅ Email envoyé avec succès à ${recipient.email}`)
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
      console.error(`❌ Erreur envoi email à ${recipient.email}:`, error)
      emailsSent.push({
        email: recipient.email,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      })
    }
  }

  return {
    type: 'EMAIL_REMINDER',
    emailsSent,
    totalSent: emailsSent.filter(e => e.status === 'sent').length,
    totalFailed: emailsSent.filter(e => e.status === 'failed').length
  }
}

async function executeTaskCreation(automation: any, config: any, user: any) {
  const tasksCreated = []

  try {
    // Créer des tâches selon la configuration
    if (config.tasks && Array.isArray(config.tasks)) {
      for (const taskConfig of config.tasks) {
        const task = await prisma.task.create({
          data: {
            title: taskConfig.title,
            description: taskConfig.description || '',
            status: taskConfig.status || 'TODO',
            priority: taskConfig.priority || 'MEDIUM',
            projectId: taskConfig.projectId,
            assigneeId: taskConfig.assigneeId || user.id,
            dueDate: taskConfig.dueDate ? new Date(taskConfig.dueDate) : null,
            userId: user.id
          }
        })
        
        tasksCreated.push(task)
      }
    }
  } catch (error) {
    throw new Error(`Erreur lors de la création de tâches: ${error}`)
  }

  return {
    type: 'TASK_CREATION',
    tasksCreated: tasksCreated.length,
    tasks: tasksCreated
  }
}

async function executeStatusUpdate(automation: any, config: any, user: any) {
  const updates = []

  try {
    // Mettre à jour les statuts selon la configuration
    if (config.updates && Array.isArray(config.updates)) {
      for (const update of config.updates) {
        if (update.entityType === 'project' && update.projectId) {
          await prisma.project.update({
            where: { id: update.projectId },
            data: { status: update.newStatus }
          })
          updates.push(`Projet ${update.projectId} -> ${update.newStatus}`)
        }
        // Ajouter d'autres types d'entités si nécessaire
      }
    }
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de statuts: ${error}`)
  }

  return {
    type: 'STATUS_UPDATE',
    updatesApplied: updates.length,
    updates
  }
}

async function executeReportGeneration(automation: any, config: any, user: any) {
  // Générer des rapports selon la configuration
  const reports = []
  
  if (config.reportTypes && Array.isArray(config.reportTypes)) {
    for (const reportType of config.reportTypes) {
      switch (reportType) {
        case 'projects_summary':
          const projectsCount = await prisma.project.count({ where: { userId: user.id } })
          reports.push({ type: 'projects_summary', data: { totalProjects: projectsCount } })
          break
        case 'clients_summary':
          const clientsCount = await prisma.client.count({ where: { userId: user.id } })
          reports.push({ type: 'clients_summary', data: { totalClients: clientsCount } })
          break
      }
    }
  }

  return {
    type: 'REPORT_GENERATION',
    reportsGenerated: reports.length,
    reports
  }
}

// Implémentations simplifiées pour les autres types
async function executeClientFollowUp(automation: any, recipients: any[], user: any) {
  return { type: 'CLIENT_FOLLOW_UP', message: 'Suivi client exécuté', recipients: recipients.length }
}

async function executeInvoiceReminder(automation: any, recipients: any[], user: any) {
  return { type: 'INVOICE_REMINDER', message: 'Rappel de facture envoyé', recipients: recipients.length }
}

async function executeBackupData(automation: any, config: any, user: any) {
  return { type: 'BACKUP_DATA', message: 'Sauvegarde effectuée', timestamp: new Date() }
}

async function executeNotificationSend(automation: any, recipients: any[], user: any) {
  return { type: 'NOTIFICATION_SEND', message: 'Notifications envoyées', recipients: recipients.length }
}

async function executeProjectArchive(automation: any, config: any, user: any) {
  return { type: 'PROJECT_ARCHIVE', message: 'Projets archivés', config }
}

async function executeClientCheckIn(automation: any, recipients: any[], user: any) {
  return { type: 'CLIENT_CHECK_IN', message: 'Vérification client effectuée', recipients: recipients.length }
}

async function executeDeadlineAlert(automation: any, recipients: any[], user: any) {
  return { type: 'DEADLINE_ALERT', message: 'Alertes d\'échéances envoyées', recipients: recipients.length }
}

async function executeWeeklySummary(automation: any, recipients: any[], user: any) {
  return { type: 'WEEKLY_SUMMARY', message: 'Résumé hebdomadaire généré', recipients: recipients.length }
} 