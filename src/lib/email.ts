import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Interface pour les données d'email
export interface EmailData {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
  fromName?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  userId: string
  clientId?: string
  projectId?: string
  invoiceId?: string
  quoteId?: string
  scheduledAt?: Date
}

// Configuration du transporteur email
export function createEmailTransporter() {
  const config = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  return nodemailer.createTransport(config)
}

// Générer un token de tracking sécurisé
export function generateTrackingToken(emailId: string): string {
  const secret = process.env.EMAIL_TRACKING_SECRET || 'default-secret-change-in-production'
  return crypto.createHmac('sha256', secret).update(emailId).digest('hex').substring(0, 16)
}

// Générer un Message-ID unique
export function generateMessageId(domain?: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const emailDomain = domain || process.env.EMAIL_DOMAIN || 'localhost'
  return `<${timestamp}.${random}@${emailDomain}>`
}

// Insérer le pixel de tracking dans le contenu HTML
export function insertTrackingPixel(htmlContent: string, emailId: string): string {
  const token = generateTrackingToken(emailId)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const trackingUrl = `${baseUrl}/api/track/open?id=${emailId}&token=${token}`
  
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`
  
  // Insérer le pixel juste avant la fermeture du body, ou à la fin si pas de body
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', `${trackingPixel}</body>`)
  } else {
    return htmlContent + trackingPixel
  }
}

// Préparer les headers pour le threading d'emails
export function prepareEmailHeaders(options: {
  messageId?: string
  inReplyTo?: string
  references?: string
  threadId?: string
}) {
  const headers: Record<string, string> = {}
  
  if (options.messageId) {
    headers['Message-ID'] = options.messageId
  }
  
  if (options.inReplyTo) {
    headers['In-Reply-To'] = options.inReplyTo
  }
  
  if (options.references) {
    headers['References'] = options.references
  }
  
  if (options.threadId) {
    headers['X-Thread-ID'] = options.threadId
  }
  
  return headers
}

// Envoyer un email
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    const transporter = createEmailTransporter()
    
    // Générer un Message-ID unique
    const messageId = generateMessageId()
    
    // Créer l'enregistrement email en base de données
    const email = await prisma.email.create({
      data: {
        messageId,
        subject: emailData.subject,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
        fromName: emailData.fromName || process.env.SMTP_FROM_NAME || '',
        toEmail: emailData.to,
        toName: emailData.toName,
        ccEmails: emailData.cc ? JSON.stringify(emailData.cc) : null,
        bccEmails: emailData.bcc ? JSON.stringify(emailData.bcc) : null,
        replyToEmail: emailData.replyTo,
        status: emailData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: emailData.scheduledAt,
        userId: emailData.userId,
        clientId: emailData.clientId,
        projectId: emailData.projectId,
        invoiceId: emailData.invoiceId,
        quoteId: emailData.quoteId,
      }
    })

    // Si l'email est programmé pour plus tard, ne pas l'envoyer maintenant
    if (emailData.scheduledAt && emailData.scheduledAt > new Date()) {
      return { success: true, emailId: email.id }
    }

    // Insérer le pixel de tracking dans le contenu HTML
    const htmlWithTracking = insertTrackingPixel(emailData.htmlContent, email.id)

    // Préparer les options d'envoi
    const mailOptions = {
      from: emailData.fromName 
        ? `"${emailData.fromName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`
        : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: emailData.toName ? `"${emailData.toName}" <${emailData.to}>` : emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      replyTo: emailData.replyTo,
      subject: emailData.subject,
      text: emailData.textContent,
      html: htmlWithTracking,
      headers: prepareEmailHeaders({ messageId })
    }

    // Envoyer l'email
    await transporter.sendMail(mailOptions)
    
    // Mettre à jour le statut en base de données
    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        htmlContent: htmlWithTracking, // Sauvegarder le contenu avec le pixel
      }
    })

    console.log('Email envoyé avec succès')
    return { success: true, emailId: email.id }

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

// Envoyer un email de réponse (avec threading)
export async function sendReplyEmail(
  originalEmailId: string, 
  emailData: Omit<EmailData, 'userId'> & { userId: string }
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Récupérer l'email original pour les headers de threading
    const originalEmail = await prisma.email.findUnique({
      where: { id: originalEmailId }
    })

    if (!originalEmail) {
      return { success: false, error: 'Email original non trouvé' }
    }

    // Préparer les headers de threading
    const references = originalEmail.references 
      ? `${originalEmail.references} ${originalEmail.messageId}`
      : originalEmail.messageId
      
    const messageId = generateMessageId()
    
    // Créer l'enregistrement email en base de données
    const email = await prisma.email.create({
      data: {
        messageId,
        subject: emailData.subject.startsWith('Re: ') ? emailData.subject : `Re: ${emailData.subject}`,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
        fromName: emailData.fromName || process.env.SMTP_FROM_NAME || '',
        toEmail: emailData.to,
        toName: emailData.toName,
        ccEmails: emailData.cc ? JSON.stringify(emailData.cc) : null,
        bccEmails: emailData.bcc ? JSON.stringify(emailData.bcc) : null,
        replyToEmail: emailData.replyTo,
        status: 'DRAFT',
        inReplyTo: originalEmail.messageId,
        references,
        threadId: originalEmail.threadId || originalEmail.messageId,
        userId: emailData.userId,
        clientId: emailData.clientId || originalEmail.clientId,
        projectId: emailData.projectId || originalEmail.projectId,
        invoiceId: emailData.invoiceId,
        quoteId: emailData.quoteId,
      }
    })

    // Insérer le pixel de tracking
    const htmlWithTracking = insertTrackingPixel(emailData.htmlContent, email.id)

    const transporter = createEmailTransporter()
    
    // Préparer les options d'envoi avec headers de threading
    const mailOptions = {
      from: emailData.fromName 
        ? `"${emailData.fromName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`
        : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: emailData.toName ? `"${emailData.toName}" <${emailData.to}>` : emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      replyTo: emailData.replyTo,
      subject: email.subject,
      text: emailData.textContent,
      html: htmlWithTracking,
      headers: prepareEmailHeaders({
        messageId,
        inReplyTo: originalEmail.messageId,
        references,
        threadId: originalEmail.threadId || originalEmail.messageId
      })
    }

    // Envoyer l'email
    await transporter.sendMail(mailOptions)
    
    // Mettre à jour le statut
    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        htmlContent: htmlWithTracking,
      }
    })

    return { success: true, emailId: email.id }

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la réponse email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

// Marquer un email comme bounced
export async function markEmailAsBounced(emailId: string, reason: string) {
  try {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        bounced: true,
        bouncedAt: new Date(),
        bounceReason: reason,
        status: 'BOUNCED'
      }
    })
  } catch (error) {
    console.error('Erreur lors du marquage email bounced:', error)
  }
}

// Vérifier la configuration email
export async function verifyEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createEmailTransporter()
    await transporter.verify()
    return { success: true }
  } catch (error) {
    console.error('Configuration email invalide:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Configuration email invalide' 
    }
  }
} 