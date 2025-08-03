import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, EmailData } from '@/lib/email'

// POST /api/emails/[id]/send - Envoyer un email existant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'email avec toutes ses informations
    const email = await prisma.email.findUnique({
      where: { 
        id: params.id,
        userId: user.id,
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que l'email peut être envoyé
    if (!['DRAFT', 'SCHEDULED'].includes(email.status)) {
      return NextResponse.json(
        { error: 'Cet email a déjà été envoyé ou ne peut pas être envoyé' },
        { status: 400 }
      )
    }

    // Préparer les données d'email
    const emailData: EmailData = {
      to: email.toEmail,
      toName: email.toName || undefined,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent || undefined,
      fromName: email.fromName || undefined,
      replyTo: email.replyToEmail || undefined,
      cc: email.ccEmails ? JSON.parse(email.ccEmails) : undefined,
      bcc: email.bccEmails ? JSON.parse(email.bccEmails) : undefined,
      userId: user.id,
      clientId: email.clientId || undefined,
      projectId: email.projectId || undefined,
      invoiceId: email.invoiceId || undefined,
      quoteId: email.quoteId || undefined,
    }

    // Mettre à jour l'email avec un messageId temporaire
    const messageId = `temp-${email.id}-${Date.now()}`
    await prisma.email.update({
      where: { id: email.id },
      data: {
        messageId: messageId,
        status: 'SENT',
        sentAt: new Date(),
      }
    })

    // Envoyer l'email en utilisant les données existantes mais avec le nouvel ID
    try {
      // Importer et utiliser les fonctions d'envoi directement
      const { generateMessageId, insertTrackingPixel, createEmailTransporter, prepareEmailHeaders } = 
        await import('@/lib/email')
      
      const transporter = createEmailTransporter()
      const realMessageId = generateMessageId()
      
      // Insérer le pixel de tracking
      const htmlWithTracking = insertTrackingPixel(email.htmlContent, email.id)
      
      // Préparer les options d'envoi
      const mailOptions = {
        from: email.fromName 
          ? `"${email.fromName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`
          : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to: email.toName ? `"${email.toName}" <${email.toEmail}>` : email.toEmail,
        cc: emailData.cc,
        bcc: emailData.bcc,
        replyTo: email.replyToEmail,
        subject: email.subject,
        text: email.textContent,
        html: htmlWithTracking,
        headers: prepareEmailHeaders({ messageId: realMessageId })
      }

      // Envoyer l'email
      const info = await transporter.sendMail(mailOptions)
      
      // Mettre à jour avec le vrai Message-ID
      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: {
          messageId: realMessageId,
          htmlContent: htmlWithTracking,
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

      console.log('Email envoyé:', info.messageId)
      
      return NextResponse.json({
        success: true,
        email: updatedEmail,
        message: 'Email envoyé avec succès'
      })

    } catch (sendError) {
      // En cas d'erreur d'envoi, remettre le statut original
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: email.status, // Remettre le statut original
          sentAt: null,
          messageId: '',
        }
      })
      
      console.error('Erreur lors de l\'envoi de l\'email:', sendError)
      return NextResponse.json(
        { error: `Erreur lors de l'envoi: ${sendError instanceof Error ? sendError.message : 'Erreur inconnue'}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 