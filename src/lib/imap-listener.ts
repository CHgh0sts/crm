import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { prisma } from '@/lib/db'

// Interface pour la configuration IMAP
interface ImapConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Interface pour les adresses emails
interface EmailAddress {
  address: string
  name?: string
}

// Interface pour les données d'email parsé
interface ParsedEmail {
  messageId: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  inReplyTo?: string
  references?: string[]
  date: Date
  text?: string
  html?: string
  headers: Map<string, string>
}

export class ImapEmailListener {
  private client: ImapFlow | null = null
  private config: ImapConfig
  private isRunning = false
  private reconnectInterval = 30000 // 30 secondes
  private maxReconnectAttempts = 10
  private reconnectAttempts = 0

  constructor() {
    this.config = {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      secure: process.env.IMAP_SECURE !== 'false', // true par défaut
      auth: {
        user: process.env.IMAP_USER || '',
        pass: process.env.IMAP_PASSWORD || '',
      }
    }
  }

  // Démarrer l'écoute IMAP
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('IMAP listener déjà en cours d\'exécution')
      return
    }

    try {
      await this.connect()
      this.isRunning = true
      console.log('IMAP listener démarré avec succès')
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'IMAP listener:', error)
      this.scheduleReconnect()
    }
  }

  // Arrêter l'écoute IMAP
  async stop(): Promise<void> {
    this.isRunning = false
    if (this.client) {
      await this.client.logout()
      this.client = null
    }
    console.log('IMAP listener arrêté')
  }

  // Se connecter au serveur IMAP
  private async connect(): Promise<void> {
    this.client = new ImapFlow({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      logger: false // Désactiver les logs verbeux
    })

    // Événements de connexion
    this.client.on('close', () => {
      console.log('Connexion IMAP fermée')
      if (this.isRunning) {
        this.scheduleReconnect()
      }
    })

    this.client.on('error', (error) => {
      console.error('Erreur IMAP:', error)
      if (this.isRunning) {
        this.scheduleReconnect()
      }
    })

    // Connexion au serveur
    await this.client.connect()
    console.log('Connecté au serveur IMAP')

    // Sélectionner la boîte de réception
    await this.client.mailboxOpen('INBOX')
    console.log('Boîte de réception INBOX ouverte')

    // Écouter les nouveaux messages
    this.client.on('exists', async (data) => {
      console.log(`${data.count} nouveaux messages détectés`)
      await this.checkNewMessages()
    })

    // Vérifier les messages non lus au démarrage
    await this.checkNewMessages()
    this.reconnectAttempts = 0 // Reset sur connexion réussie
  }

  // Planifier une reconnexion
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Nombre maximum de tentatives de reconnexion atteint')
      this.isRunning = false
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * this.reconnectAttempts
    
    console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`)
    
    setTimeout(async () => {
      if (this.isRunning) {
        try {
          await this.connect()
        } catch (error) {
          console.error('Échec de la reconnexion:', error)
          this.scheduleReconnect()
        }
      }
    }, delay)
  }

  // Vérifier les nouveaux messages
  private async checkNewMessages(): Promise<void> {
    if (!this.client) return

    try {
      // Rechercher les messages non lus
      const searchResults = await this.client.search({ seen: false })
      
      if (!searchResults || Array.isArray(searchResults) && searchResults.length === 0) {
        return
      }

      console.log(`${searchResults.length} messages non lus trouvés`)

      // Traiter chaque message
      for (const uid of searchResults) {
        try {
          await this.processMessage(uid)
        } catch (error) {
          console.error(`Erreur lors du traitement du message ${uid}:`, error)
        }
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des nouveaux messages:', error)
    }
  }

  // Traiter un message spécifique
  private async processMessage(uid: number): Promise<void> {
    if (!this.client) return

    try {
      // Télécharger le message complet
      const messageData = await this.client.fetchOne(uid, { source: true })
      
      if (!messageData || !('source' in messageData) || !messageData.source) {
        console.warn(`Pas de source pour le message ${uid}`)
        return
      }

      // Parser le message
      const parsed = await simpleParser(messageData.source)
      
      // Convertir en format standardisé
      const fromAddress = Array.isArray(parsed.from) ? parsed.from[0] : parsed.from
      const toAddresses = Array.isArray(parsed.to) ? parsed.to : (parsed.to ? [parsed.to] : [])
      const ccAddresses = Array.isArray(parsed.cc) ? parsed.cc : (parsed.cc ? [parsed.cc] : [])
      
      const email: ParsedEmail = {
        messageId: parsed.messageId || '',
        subject: parsed.subject || '',
        from: {
          address: (fromAddress as any)?.address || '',
          name: (fromAddress as any)?.name
        },
        to: toAddresses.map((addr: any) => ({
          address: addr?.address || '',
          name: addr?.name
        })),
        cc: ccAddresses.map((addr: any) => ({
          address: addr?.address || '',
          name: addr?.name
        })),
        inReplyTo: typeof parsed.inReplyTo === 'string' ? parsed.inReplyTo : undefined,
        references: parsed.references ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references]) : undefined,
        date: parsed.date || new Date(),
        text: parsed.text,
        html: parsed.html || undefined,
        headers: new Map() // Simplifier pour éviter les erreurs de type
      }

      // Traiter la réponse
      await this.handleEmailReply(email)

      // Marquer comme lu
      await this.client.messageFlagsAdd(uid, ['\\Seen'])

    } catch (error) {
      console.error(`Erreur lors du traitement du message ${uid}:`, error)
    }
  }

  // Traiter une réponse email
  private async handleEmailReply(email: ParsedEmail): Promise<void> {
    try {
      // Chercher l'email original basé sur In-Reply-To ou References
      let originalEmail = null

      // 1. Chercher par In-Reply-To
      if (email.inReplyTo) {
        originalEmail = await prisma.email.findFirst({
          where: { messageId: email.inReplyTo },
          include: { user: true, client: true, project: true }
        })
      }

      // 2. Si pas trouvé, chercher dans References
      if (!originalEmail && email.references) {
        for (const ref of email.references) {
          originalEmail = await prisma.email.findFirst({
            where: { messageId: ref },
            include: { user: true, client: true, project: true }
          })
          if (originalEmail) break
        }
      }

      // 3. Si pas trouvé, chercher par subject et adresse email
      if (!originalEmail) {
        const cleanSubject = email.subject.replace(/^(Re:|Fwd:|RE:|FWD:)\s*/i, '').trim()
        originalEmail = await prisma.email.findFirst({
          where: {
            subject: { contains: cleanSubject },
            toEmail: email.from.address,
            sentAt: { not: null }
          },
          include: { user: true, client: true, project: true },
          orderBy: { sentAt: 'desc' }
        })
      }

      if (!originalEmail) {
        console.log(`Aucun email original trouvé pour la réponse: ${email.subject}`)
        return
      }

      // Mettre à jour l'email original avec les informations de réponse
      await prisma.email.update({
        where: { id: originalEmail.id },
        data: {
          respondedAt: originalEmail.respondedAt || email.date,
          lastResponseAt: email.date,
          responseCount: { increment: 1 },
          status: originalEmail.status === 'OPENED' || originalEmail.status === 'SENT' || originalEmail.status === 'DELIVERED' 
            ? 'REPLIED' 
            : originalEmail.status
        }
      })

      // Créer une notification de réponse
      await this.createReplyNotification(originalEmail, email)

      console.log(`Réponse traitée pour l'email: ${originalEmail.subject}`)

    } catch (error) {
      console.error('Erreur lors du traitement de la réponse email:', error)
    }
  }

  // Créer une notification de réponse
  private async createReplyNotification(originalEmail: { id: string; subject: string; userId: string }, replyEmail: ParsedEmail): Promise<void> {
    try {
      const clientName = replyEmail.from.name || replyEmail.from.address
      const subject = originalEmail.subject.length > 50 
        ? originalEmail.subject.substring(0, 50) + '...' 
        : originalEmail.subject

      await prisma.notification.create({
        data: {
          userId: originalEmail.userId,
          type: 'SUCCESS',
          title: 'Réponse reçue',
          message: `${clientName} a répondu à l'email "${subject}"`,
          data: {
            emailId: originalEmail.id,
            replyMessageId: replyEmail.messageId,
            repliedAt: replyEmail.date,
            type: 'email_reply'
          }
        }
      })
    } catch (error) {
      console.error('Erreur lors de la création de la notification de réponse:', error)
    }
  }

  // Vérifier la configuration IMAP
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testClient = new ImapFlow(this.config)
      await testClient.connect()
      await testClient.logout()
      return { success: true }
    } catch (error) {
      console.error('Test de connexion IMAP échoué:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion IMAP' 
      }
    }
  }
}

// Instance singleton de l'IMAP listener
let imapListener: ImapEmailListener | null = null

// Obtenir l'instance de l'IMAP listener
export function getImapListener(): ImapEmailListener {
  if (!imapListener) {
    imapListener = new ImapEmailListener()
  }
  return imapListener
}

// Démarrer l'écoute IMAP (à appeler au démarrage de l'application)
export async function startImapListener(): Promise<void> {
  const listener = getImapListener()
  await listener.start()
}

// Arrêter l'écoute IMAP
export async function stopImapListener(): Promise<void> {
  if (imapListener) {
    await imapListener.stop()
    imapListener = null
  }
} 