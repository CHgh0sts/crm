'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { useInvoiceTemplates } from '@/hooks/use-invoice-templates'

interface TemplateInitButtonProps {
  onTemplatesInitialized?: () => void
}

export function TemplateInitButton({ onTemplatesInitialized }: TemplateInitButtonProps) {
  const { 
    hasDefaultTemplates, 
    initializingDefaults, 
    initializeDefaultTemplates 
  } = useInvoiceTemplates()

  const handleInitialize = async () => {
    try {
      await initializeDefaultTemplates()
      onTemplatesInitialized?.()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des templates:', error)
    }
  }

  // Ne pas afficher le bouton si on ne sait pas encore ou si les templates existent déjà
  if (hasDefaultTemplates === null || hasDefaultTemplates) {
    return null
  }

  return (
    <Button
      onClick={handleInitialize}
      disabled={initializingDefaults}
      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
    >
      {initializingDefaults ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {initializingDefaults ? 'Initialisation...' : 'Charger les templates par défaut'}
    </Button>
  )
} 