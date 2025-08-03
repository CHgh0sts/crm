'use client'

import { useEffect, useRef } from 'react'

export function AutomationScheduler({ enabled = false }: { enabled?: boolean }) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    // Ne s'exécute que si explicitement activé (côté serveur recommandé)
    if (!enabled) {
      console.log('🔄 Scheduler côté client désactivé - Utilisez le scheduler côté serveur')
      return
    }

    // Fonction pour vérifier et exécuter les automatisations
    const checkAutomations = async () => {
      // Éviter les exécutions multiples simultanées
      if (isRunningRef.current) {
        console.log('⏸️ Scheduler déjà en cours, on passe ce cycle')
        return
      }

      try {
        isRunningRef.current = true
        console.log('🔄 Vérification automatique des automatisations...')
        
        const response = await fetch('/api/automations/scheduler', {
          method: 'GET',
          cache: 'no-store'
        })

        if (response.ok) {
          const result = await response.json()
          
          if (result.executedCount > 0) {
            console.log(`✅ ${result.executedCount} automatisation(s) exécutée(s)`)
            
            // Afficher les détails dans les logs
            result.results?.forEach((item: any) => {
              if (item.status === 'SUCCESS') {
                console.log(`✅ ${item.name} - Prochaine exécution: ${item.nextExecution}`)
              } else if (item.status === 'FAILED') {
                console.log(`❌ ${item.name} - Erreur: ${item.error}`)
              }
            })
          } else {
            console.log('💤 Aucune automatisation à exécuter pour le moment')
          }
        } else {
          console.error('❌ Erreur lors de la vérification du scheduler:', response.status)
        }
      } catch (error) {
        console.error('❌ Erreur de connexion au scheduler:', error)
      } finally {
        isRunningRef.current = false
      }
    }

    // Exécuter immédiatement une première fois (optionnel)
    // checkAutomations()

    // Configurer l'intervalle pour vérifier toutes les 30 secondes
    intervalRef.current = setInterval(checkAutomations, 30 * 1000)

    console.log('🎯 Scheduler automatique démarré (vérification toutes les 30 secondes)')

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        console.log('🛑 Scheduler automatique arrêté')
      }
    }
  }, [enabled])

  // Ce composant ne rend rien visuellement
  return null
} 