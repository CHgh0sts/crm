'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TemplateBuilder } from '@/components/invoices/template-builder'
import { useInvoiceTemplates } from '@/hooks/use-invoice-templates'
import { PageLoading } from '@/components/ui/loading'

// Composant pour gérer les paramètres de recherche
function TemplateBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('id')
  const { fetchTemplate, createTemplate, updateTemplate } = useInvoiceTemplates()
  
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    } else {
      // Nouveau template
      setTemplate({
        name: 'Nouveau template',
        description: '',
        category: 'BUSINESS',
        elements: [],
        styles: {
          colors: {
            primary: '#1f2937',
            secondary: '#6b7280',
            accent: '#3b82f6',
            background: '#ffffff'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            secondary: 'Arial, sans-serif'
          }
        },
        layout: {
          width: '210mm',
          height: '297mm',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        },
        variables: {}
      })
    }
  }, [templateId])

  const loadTemplate = async () => {
    if (!templateId) return
    
    setLoading(true)
    try {
      const templateData = await fetchTemplate(templateId)
      if (templateData) {
        setTemplate(templateData)
      } else {
        router.push('/templates')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du template:', error)
      router.push('/templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (templateData: any) => {
    try {
      setLoading(true)
      
      const success = templateId 
        ? await updateTemplate(templateId, templateData)
        : await createTemplate(templateData)

      if (success) {
        console.log('Template sauvegardé avec succès')
        router.push('/templates')
      } else {
        console.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  if (loading || (templateId && !template)) {
    return <PageLoading />
  }

  if (!template) {
    return <div>Erreur: Template non trouvé</div>
  }

  return (
    <TemplateBuilder
      template={template}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}

// Composant principal avec Suspense boundary
export default function TemplateBuilderPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TemplateBuilderContent />
    </Suspense>
  )
} 