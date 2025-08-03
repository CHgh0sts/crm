import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
})

// PUT /api/user/change-password - Changer le mot de passe de l'utilisateur
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Récupérer l'utilisateur avec son mot de passe
    const userWithPassword = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        password: true,
      },
    })

    if (!userWithPassword) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    })

    // Optionnel: Invalider toutes les sessions existantes pour forcer une reconnexion
    // Cela dépend de votre système de sessions
    
    return NextResponse.json({
      message: 'Mot de passe changé avec succès',
    })
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)

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