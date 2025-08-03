import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/track/open - Tracker l'ouverture d'un email via pixel invisible
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get('id')
    const token = searchParams.get('token')

    if (!emailId || !token) {
      // Retourner un pixel transparent même en cas d'erreur pour ne pas casser l'affichage de l'email
      return new NextResponse(Buffer.from(TRACKING_PIXEL_BASE64, 'base64'), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Vérifier que l'email existe et que le token correspond
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { user: true }
    })

    if (!email) {
      return new NextResponse(Buffer.from(TRACKING_PIXEL_BASE64, 'base64'), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // Générer le token attendu (basé sur l'ID de l'email et un secret)
    const expectedToken = generateTrackingToken(emailId)
    if (token !== expectedToken) {
      return new NextResponse(Buffer.from(TRACKING_PIXEL_BASE64, 'base64'), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }

    // Extraire les informations de tracking
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const now = new Date()

    // Mettre à jour l'email avec les informations de tracking
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        openedAt: email.openedAt || now, // Ne pas écraser la première ouverture
        openedIpAddress: email.openedIpAddress || ipAddress,
        openedUserAgent: email.openedUserAgent || userAgent,
        openCount: { increment: 1 },
        status: email.status === 'SENT' || email.status === 'DELIVERED' ? 'OPENED' : email.status,
        updatedAt: now
      },
      include: { user: true, client: true, project: true }
    })

    // Créer une notification si c'est la première ouverture
    if (!email.openedAt) {
      await createEmailOpenedNotification(updatedEmail)
    }

    // Retourner le pixel de tracking transparent
    return new NextResponse(Buffer.from(TRACKING_PIXEL_BASE64, 'base64'), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Erreur lors du tracking d\'ouverture email:', error)
    
    // Toujours retourner un pixel transparent même en cas d'erreur
    return new NextResponse(Buffer.from(TRACKING_PIXEL_BASE64, 'base64'), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// Pixel transparent 1x1 en base64
const TRACKING_PIXEL_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

// Générer un token de tracking sécurisé
function generateTrackingToken(emailId: string): string {
  const secret = process.env.EMAIL_TRACKING_SECRET || 'default-secret-change-in-production'
  const crypto = require('crypto')
  return crypto.createHmac('sha256', secret).update(emailId).digest('hex').substring(0, 16)
}

// Extraire l'adresse IP du client
function getClientIP(request: NextRequest): string {
  // Vérifier les headers de proxy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

// Créer une notification d'ouverture d'email
async function createEmailOpenedNotification(email: any) {
  try {
    const clientName = email.client?.name || email.toEmail
    const subject = email.subject.length > 50 ? email.subject.substring(0, 50) + '...' : email.subject

    await prisma.notification.create({
      data: {
        userId: email.userId,
        type: 'INFO',
        title: 'Email ouvert',
        message: `${clientName} a ouvert l'email "${subject}"`,
        data: {
          emailId: email.id,
          messageId: email.messageId,
          clientId: email.clientId,
          projectId: email.projectId,
          openedAt: email.openedAt,
          type: 'email_opened'
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de la création de la notification d\'ouverture:', error)
  }
} 