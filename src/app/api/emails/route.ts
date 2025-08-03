import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, EmailData } from '@/lib/email'

const createEmailSchema = z.object({
  to: z.string().email('Email destinataire invalide'),
  toName: z.string().optional(),
  subject: z.string().min(1, 'Le sujet est requis'),
  htmlContent: z.string().min(1, 'Le contenu HTML est requis'),
  textContent: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email('Email de réponse invalide').optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  invoiceId: z.string().optional(),
  quoteId: z.string().optional(),
  scheduledAt: z.string().transform((date) => new Date(date)).optional(),
  sendNow: z.boolean().default(false),
})

const updateEmailSchema = z.object({
  subject: z.string().min(1, 'Le sujet est requis').optional(),
  htmlContent: z.string().min(1, 'Le contenu HTML est requis').optional(),
  textContent: z.string().optional(),
  scheduledAt: z.string().transform((date) => new Date(date)).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'DELIVERED', 'OPENED', 'REPLIED', 'BOUNCED', 'FAILED']).optional(),
})

// GET /api/emails - Récupérer tous les emails de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Construire les filtres
    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { toEmail: { contains: search, mode: 'insensitive' } },
        { toName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Récupérer les emails avec pagination
    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              status: true,
            }
          },
          invoice: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
            }
          },
          quote: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
            }
          },
          replies: {
            select: {
              id: true,
              subject: true,
              sentAt: true,
              status: true,
            },
            orderBy: { sentAt: 'desc' },
            take: 5,
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.email.count({ where })
    ])

    // Calculer les statistiques
    const stats = await prisma.email.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true },
    })

    const emailStats = {
      total,
      draft: stats.find(s => s.status === 'DRAFT')?._count.status || 0,
      sent: stats.find(s => s.status === 'SENT')?._count.status || 0,
      opened: stats.find(s => s.status === 'OPENED')?._count.status || 0,
      replied: stats.find(s => s.status === 'REPLIED')?._count.status || 0,
      bounced: stats.find(s => s.status === 'BOUNCED')?._count.status || 0,
    }

    return NextResponse.json({
      emails,
      stats: emailStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des emails:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/emails - Créer et optionnellement envoyer un email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEmailSchema.parse(body)

    // Préparer les données d'email
    const emailData: EmailData = {
      to: validatedData.to,
      toName: validatedData.toName,
      subject: validatedData.subject,
      htmlContent: validatedData.htmlContent,
      textContent: validatedData.textContent,
      fromName: validatedData.fromName,
      replyTo: validatedData.replyTo,
      cc: validatedData.cc,
      bcc: validatedData.bcc,
      userId: user.id,
      clientId: validatedData.clientId,
      projectId: validatedData.projectId,
      invoiceId: validatedData.invoiceId,
      quoteId: validatedData.quoteId,
      scheduledAt: validatedData.scheduledAt,
    }

    // Envoyer l'email si demandé
    if (validatedData.sendNow) {
      const result = await sendEmail(emailData)
      
      if (!result.success) {
        return NextResponse.json(
          { error: `Erreur lors de l'envoi: ${result.error}` },
          { status: 400 }
        )
      }

      // Récupérer l'email créé avec ses relations
      const email = await prisma.email.findUnique({
        where: { id: result.emailId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              status: true,
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        email,
        message: 'Email envoyé avec succès'
      })
    } else {
      // Créer seulement un brouillon
      const email = await prisma.email.create({
        data: {
          messageId: '', // Sera généré lors de l'envoi
          subject: validatedData.subject,
          htmlContent: validatedData.htmlContent,
          textContent: validatedData.textContent || '',
          fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
          fromName: validatedData.fromName || process.env.SMTP_FROM_NAME || '',
          toEmail: validatedData.to,
          toName: validatedData.toName,
          ccEmails: validatedData.cc ? JSON.stringify(validatedData.cc) : null,
          bccEmails: validatedData.bcc ? JSON.stringify(validatedData.bcc) : null,
          replyToEmail: validatedData.replyTo,
          status: validatedData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: validatedData.scheduledAt,
          userId: user.id,
          clientId: validatedData.clientId,
          projectId: validatedData.projectId,
          invoiceId: validatedData.invoiceId,
          quoteId: validatedData.quoteId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              color: true,
              status: true,
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        email,
        message: 'Brouillon sauvegardé avec succès'
      })
    }

  } catch (error) {
    console.error('Erreur lors de la création de l\'email:', error)
    
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