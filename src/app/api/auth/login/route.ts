import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer le token JWT
    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      theme: user.theme,
    }

    const token = generateToken(authUser)

    // Créer une session en base
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Définir le cookie
    await setAuthCookie(token)

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: authUser,
      message: 'Connexion réussie',
    })

  } catch (error) {
    console.error('Erreur de connexion:', error)
    
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