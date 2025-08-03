import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthCookie, removeAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token actuel
    const token = await getAuthCookie()
    
    if (token) {
      // Supprimer la session de la base de données
      await prisma.session.deleteMany({
        where: { token },
      })
    }

    // Supprimer le cookie
    await removeAuthCookie()

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    })

  } catch (error) {
    console.error('Erreur de déconnexion:', error)
    
    // Même en cas d'erreur, on supprime le cookie côté client
    await removeAuthCookie()
    
    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    })
  }
}

// Permettre aussi la méthode DELETE
export async function DELETE(request: NextRequest) {
  return POST(request)
} 