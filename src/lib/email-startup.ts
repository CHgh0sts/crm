import { startImapListener, getImapListener } from '@/lib/imap-listener'
import { verifyEmailConfiguration } from '@/lib/email'

// Fonction pour initialiser le système email au démarrage
export async function initializeEmailSystem(): Promise<void> {
  console.log('🚀 Initialisation du système email...')

  try {
    // 1. Vérifier la configuration SMTP
    console.log('📧 Vérification de la configuration SMTP...')
    const smtpResult = await verifyEmailConfiguration()
    
    if (!smtpResult.success) {
      console.warn('⚠️  Configuration SMTP invalide:', smtpResult.error)
      console.warn('📝 Consultez EMAIL_CONFIGURATION.md pour configurer correctement les variables d\'environnement')
      return
    }
    
    console.log('✅ Configuration SMTP validée')

    // 2. Tester la connexion IMAP
    console.log('📬 Vérification de la configuration IMAP...')
    const imapListener = getImapListener()
    const imapResult = await imapListener.testConnection()
    
    if (!imapResult.success) {
      console.warn('⚠️  Configuration IMAP invalide:', imapResult.error)
      console.warn('📝 Consultez EMAIL_CONFIGURATION.md pour configurer correctement les variables d\'environnement')
      console.warn('🔧 L\'envoi d\'emails fonctionnera mais le tracking des réponses sera désactivé')
      return
    }
    
    console.log('✅ Configuration IMAP validée')

    // 3. Démarrer l'écoute IMAP
    console.log('🎧 Démarrage de l\'écoute IMAP...')
    await startImapListener()
    console.log('✅ Système email initialisé avec succès')
    console.log('📡 Écoute des réponses emails en cours...')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du système email:', error)
    console.warn('📝 Consultez EMAIL_CONFIGURATION.md pour résoudre les problèmes de configuration')
  }
}

// Fonction pour arrêter proprement le système email
export async function shutdownEmailSystem(): Promise<void> {
  console.log('🛑 Arrêt du système email...')
  
  try {
    const { stopImapListener } = await import('@/lib/imap-listener')
    await stopImapListener()
    console.log('✅ Système email arrêté proprement')
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt du système email:', error)
  }
}

// Variables de contrôle pour éviter les initialisations multiples
let isInitialized = false
let isInitializing = false

// Fonction d'initialisation sécurisée (une seule fois)
export async function safeInitializeEmailSystem(): Promise<void> {
  if (isInitialized || isInitializing) {
    return
  }
  
  isInitializing = true
  
  try {
    await initializeEmailSystem()
    isInitialized = true
  } finally {
    isInitializing = false
  }
}

// Fonction pour vérifier si le système est initialisé
export function isEmailSystemInitialized(): boolean {
  return isInitialized
}

// Hook de nettoyage pour les signaux de fermeture
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('📡 Signal SIGTERM reçu, arrêt du système email...')
    await shutdownEmailSystem()
  })

  process.on('SIGINT', async () => {
    console.log('📡 Signal SIGINT reçu, arrêt du système email...')
    await shutdownEmailSystem()
  })

  // Hook pour Next.js en développement
  if (process.env.NODE_ENV === 'development') {
    process.on('beforeExit', async () => {
      await shutdownEmailSystem()
    })
  }
} 