import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// Schéma de validation pour un restaurant
const restaurantSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  site_web: z.string().url('URL invalide').optional().or(z.literal('')),
  type_cuisine: z.string().optional(),
  note_moyenne: z.number().optional(),
  nombre_avis: z.number().optional(),
  gamme_prix: z.string().optional(),
  horaires: z.record(z.string(), z.string()).optional(),
  services: z.array(z.string()).optional(),
  specialites: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
})

// Schéma pour la requête complète (supporte les deux formats)
const bulkImportSchema = z.union([
  // Format 1: Objet avec propriété restaurants
  z.object({
    restaurants: z.array(restaurantSchema),
    createAsProspects: z.boolean().default(true),
  }),
  // Format 2: Tableau direct de restaurants
  z.array(restaurantSchema),
])

// Interface pour le résultat de l'import
interface ImportResult {
  created: number
  skipped: number
  errors: number
  details: Array<{
    name: string
    status: 'created' | 'skipped' | 'error'
    reason?: string
    clientId?: string
  }>
}

// POST /api/clients/bulk-import - Importer des restaurants en lot comme prospects (sans authentification)
export async function POST(request: NextRequest) {
  try {
    // Note: Cette route fonctionne sans authentification pour l'import en lot
    console.log('🔄 Début de l\'import en lot sans authentification')

    // Créer ou récupérer un utilisateur système pour les imports
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@import.local' }
    })

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@import.local',
          password: 'system_import_user', // Mot de passe non utilisé
          firstName: 'Système',
          lastName: 'Import',
          role: 'USER'
        }
      })
      console.log('✅ Utilisateur système créé pour les imports')
    }

    const body = await request.json()
    const validatedData = bulkImportSchema.parse(body)

    // Normaliser les données selon le format reçu
    let restaurants: any[]
    let createAsProspects: boolean

    if (Array.isArray(validatedData)) {
      // Format 2: Tableau direct de restaurants
      restaurants = validatedData
      createAsProspects = true // Valeur par défaut
    } else {
      // Format 1: Objet avec propriété restaurants
      restaurants = validatedData.restaurants
      createAsProspects = validatedData.createAsProspects
    }

    console.log(`🚀 Début d'import en lot de ${restaurants.length} restaurants`)

    const result: ImportResult = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    }

    for (const restaurant of restaurants) {
      try {
        // Vérifier si un client existe déjà avec le même email ou nom+adresse
        let existingClient = null
        
        if (restaurant.email) {
          existingClient = await prisma.client.findFirst({
            where: {
              email: restaurant.email
            }
          })
        }

        // Si pas trouvé par email, chercher par nom et adresse
        if (!existingClient && restaurant.adresse) {
          existingClient = await prisma.client.findFirst({
            where: {
              name: restaurant.nom,
              address: restaurant.adresse
            }
          })
        }

        if (existingClient) {
          result.skipped++
          result.details.push({
            name: restaurant.nom,
            status: 'skipped',
            reason: `Client existant${restaurant.email ? ' (même email)' : ' (même nom et adresse)'}`
          })
          continue
        }

        // Préparer les données pour la création du client
        const clientData = {
          name: restaurant.nom,
          company: restaurant.nom, // Utiliser le nom comme nom d'entreprise
          email: restaurant.email || null,
          phone: restaurant.telephone || null,
          address: restaurant.adresse || null,
          website: restaurant.site_web || null,
          status: createAsProspects ? 'PROSPECT' as const : 'ACTIVE' as const,
          notes: [
            restaurant.type_cuisine ? `Type de cuisine: ${restaurant.type_cuisine}` : '',
            restaurant.note_moyenne ? `Note moyenne: ${restaurant.note_moyenne}` : '',
            restaurant.nombre_avis ? `Nombre d'avis: ${restaurant.nombre_avis}` : '',
            restaurant.gamme_prix ? `Gamme de prix: ${restaurant.gamme_prix}` : '',
            restaurant.specialites?.length ? `Spécialités: ${restaurant.specialites.join(', ')}` : '',
            restaurant.services?.length ? `Services: ${restaurant.services.join(', ')}` : '',
          ].filter(Boolean).join('\n'),
          userId: systemUser.id,
        }

        // Créer le client
        const newClient = await prisma.client.create({
          data: clientData,
          include: {
            _count: {
              select: {
                contacts: true,
                interactions: true,
                projects: true,
                invoices: true,
                quotes: true,
              },
            },
          },
        })

        result.created++
        result.details.push({
          name: restaurant.nom,
          status: 'created',
          clientId: newClient.id
        })

        console.log(`✅ Client créé: ${restaurant.nom} (ID: ${newClient.id})`)

      } catch (error) {
        console.error(`❌ Erreur lors de la création du client ${restaurant.nom}:`, error)
        result.errors++
        result.details.push({
          name: restaurant.nom,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    console.log(`🎉 Import terminé: ${result.created} créés, ${result.skipped} ignorés, ${result.errors} erreurs`)

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${result.created} clients créés, ${result.skipped} ignorés, ${result.errors} erreurs`,
      result
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de l\'import en lot:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}