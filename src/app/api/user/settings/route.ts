import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateSettingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  avatar: z.string().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY']).optional(),
  timezone: z.string().optional(),
  language: z.enum(['fr', 'en', 'es', 'de', 'it']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

// GET /api/user/settings - Récupérer les paramètres de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'utilisateur avec tous ses paramètres
    const userSettings = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        avatar: true,
        currency: true,
        timezone: true,
        language: true,
        theme: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Ajouter d'autres champs si nécessaire
      },
    })

    if (!userSettings) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Récupérer les préférences de notifications depuis une table séparée si nécessaire
    // Pour l'instant, on utilise des valeurs par défaut
    const notifications = {
      emailNotifications: true,
      pushNotifications: true,
      taskReminders: true,
      invoiceReminders: true,
      projectUpdates: true,
      clientMessages: true,
    }

    const response = {
      ...userSettings,
      notifications,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/user/settings - Mettre à jour les paramètres de l'utilisateur
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        avatar: true,
        currency: true,
        timezone: true,
        language: true,
        theme: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)

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