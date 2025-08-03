import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, EmailData } from '@/lib/email'

const updateEmailSchema = z.object({
  subject: z.string().min(1, 'Le sujet est requis').optional(),
  htmlContent: z.string().min(1, 'Le contenu HTML est requis').optional(),
  textContent: z.string().optional(),
  toName: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email('Email de réponse invalide').optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  scheduledAt: z.string().transform((date) => new Date(date)).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'DELIVERED', 'OPENED', 'REPLIED', 'BOUNCED', 'FAILED']).optional(),
})

// GET /api/emails/[id] - Récupérer un email spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const email = await prisma.email.findUnique({
      where: { 
        id: params.id,
        userId: user.id, // S'assurer que l'email appartient à l'utilisateur
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
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
            total: true,
          }
        },
        quote: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            total: true,
          }
        },
        parentEmail: {
          select: {
            id: true,
            subject: true,
            sentAt: true,
            messageId: true,
          }
        },
        replies: {
          select: {
            id: true,
            subject: true,
            sentAt: true,
            status: true,
            fromEmail: true,
            fromName: true,
          },
          orderBy: { sentAt: 'desc' }
        }
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/emails/[id] - Mettre à jour un email
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateEmailSchema.parse(body)

    // Vérifier que l'email existe et appartient à l'utilisateur
    const existingEmail = await prisma.email.findUnique({
      where: { 
        id: params.id,
        userId: user.id,
      }
    })

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Email non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'email peut être modifié (seulement brouillons et programmés)
    if (!['DRAFT', 'SCHEDULED'].includes(existingEmail.status)) {
      return NextResponse.json(
        { error: 'Cet email ne peut plus être modifié car il a déjà été envoyé' },
        { status: 400 }
      )
    }

    // Mettre à jour l'email
    const updatedEmail = await prisma.email.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        ccEmails: validatedData.cc ? JSON.stringify(validatedData.cc) : undefined,
        bccEmails: validatedData.bcc ? JSON.stringify(validatedData.bcc) : undefined,
        updatedAt: new Date(),
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
      email: updatedEmail,
      message: 'Email mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'email:', error)
    
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

// DELETE /api/emails/[id] - Supprimer un email
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'email existe et appartient à l'utilisateur
    const existingEmail = await prisma.email.findUnique({
      where: { 
        id: params.id,
        userId: user.id,
      }
    })

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Email non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'email peut être supprimé (seulement brouillons et programmés)
    if (!['DRAFT', 'SCHEDULED'].includes(existingEmail.status)) {
      return NextResponse.json(
        { error: 'Cet email ne peut pas être supprimé car il a déjà été envoyé' },
        { status: 400 }
      )
    }

    // Supprimer l'email
    await prisma.email.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Email supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 