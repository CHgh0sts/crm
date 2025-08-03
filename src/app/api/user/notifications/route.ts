import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'

const notificationsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
  invoiceReminders: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  clientMessages: z.boolean().optional(),
})

// PUT /api/user/notifications - Mettre à jour les préférences de notifications
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = notificationsSchema.parse(body)

    // Pour l'instant, on stocke les notifications en tant que JSON dans un champ ou dans une table séparée
    // Ici, on va juste retourner les données validées car on n'a pas encore de table de notifications
    
    // TODO: Stocker les préférences de notifications dans la base de données
    // Cela pourrait être dans une table séparée UserNotificationSettings ou comme JSON dans User
    
    return NextResponse.json({
      message: 'Préférences de notifications mises à jour avec succès',
      notifications: validatedData,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error)

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