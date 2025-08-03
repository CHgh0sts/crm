'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInvoiceTemplates, InvoiceTemplate } from '@/hooks/use-invoice-templates'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { TemplateRenderer } from '@/components/invoices/template-renderer'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { sanitizeElementForPdf } from '@/lib/utils'
import {
  ArrowLeft,
  Edit,
  Copy,
  FileText,
  Download,
  Printer,
  Share,
} from 'lucide-react'

export default function TemplatePreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('id')
  const previewRef = useRef<HTMLDivElement>(null)
  const { fetchTemplate, duplicateTemplate } = useInvoiceTemplates()
  
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Variables d'exemple pour le preview
  const mockVariables = {
    company: {
      name: 'Mon Entreprise SARL',
      logo: '',
      address: '123 Rue de l\'Exemple',
      city: '75000 Paris',
      country: 'France',
      email: 'contact@mon-entreprise.fr',
      phone: '+33 1 23 45 67 89',
      siret: '123 456 789 00012',
      vat: 'FR12345678901'
    },
    client: {
      name: 'Client Exemple SAS',
      address: '456 Avenue du Commerce',
      city: '69000 Lyon',
      country: 'France',
      email: 'client@exemple.fr'
    },
    invoice: {
      number: 'FAC-2024-001',
      date: '15 janvier 2024',
      dueDate: '14 février 2024',
      total: '4 872,00 €',
      subtotal: '4 060,00 €',
      tax: '812,00 €'
    },
    items: [
      {
        description: 'Développement site web',
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
        tax: 500,
        discount: 0
      },
      {
        description: 'Formation utilisateurs',
        quantity: 4,
        unitPrice: 150,
        total: 600,
        tax: 120,
        discount: 50
      },
      {
        description: 'Maintenance mensuelle',
        quantity: 12,
        unitPrice: 80,
        total: 960,
        tax: 192,
        discount: 100
      }
    ]
  }

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    } else {
      router.push('/templates')
    }
  }, [templateId])

  const loadTemplate = async () => {
    if (!templateId) return
    
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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier !')
    } catch (error) {
      toast.error('Erreur lors de la copie du lien')
    }
  }

  const handleGeneratePDF = async () => {
    if (!previewRef.current) return

    setIsGeneratingPDF(true)
    try {
      // Méthode 1 : Sanitisation complète de l'élément
      const sanitizedElement = sanitizeElementForPdf(previewRef.current)
      
      // Créer un conteneur temporaire pour le rendu
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = previewRef.current.offsetWidth + 'px'
      tempContainer.style.height = previewRef.current.offsetHeight + 'px'
      tempContainer.appendChild(sanitizedElement)
      document.body.appendChild(tempContainer)

      try {
        const canvas = await html2canvas(sanitizedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            // Ignorer les éléments qui pourraient causer des problèmes
            const computedStyle = window.getComputedStyle(element)
            const background = computedStyle.background
            return background.includes('oklch') || background.includes('lab') || background.includes('color(')
          }
        })

        // Nettoyer le conteneur temporaire
        document.body.removeChild(tempContainer)

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`${template?.name || 'template'}.pdf`)
        toast.success('PDF généré avec succès !')
        
      } catch (canvasError) {
        console.warn('Méthode 1 échouée, tentative avec méthode 2...', canvasError)
        // Nettoyer le conteneur temporaire si nécessaire
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer)
        }
        
        // Méthode 2 : Fallback avec l'élément original et options simplifiées
        const canvas = await html2canvas(previewRef.current, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          foreignObjectRendering: false, // Désactiver le rendu des objets étrangers
          width: previewRef.current.offsetWidth,
          height: previewRef.current.offsetHeight
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        pdf.save(`${template?.name || 'template'}.pdf`)
        toast.success('PDF généré avec succès (mode compatibilité) !')
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      toast.error('Erreur lors de la génération du PDF. Essayez de simplifier le design du template.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrint = async () => {
    if (!previewRef.current) return

    try {
      // Convertir les images en base64 pour l'impression
      const printElement = previewRef.current.cloneNode(true) as HTMLElement
      const images = printElement.querySelectorAll('img')
      
      // Attendre que toutes les images soient converties
      await Promise.all(Array.from(images).map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const response = await fetch(img.src)
            const blob = await response.blob()
            const reader = new FileReader()
            
            return new Promise<void>((resolve) => {
              reader.onload = () => {
                img.src = reader.result as string
                resolve()
              }
              reader.onerror = () => resolve() // Continue même en cas d'erreur
              reader.readAsDataURL(blob)
            })
          } catch (error) {
            console.warn('Erreur lors de la conversion de l\'image pour l\'impression:', error)
          }
        }
      }))

      const printWindow = window.open('', '', 'height=600,width=800')
      if (!printWindow) return

      printWindow.document.write(`
        <html>
          <head>
            <title>Impression - ${template?.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                line-height: 1.4;
              }
              img { 
                max-width: 100% !important; 
                height: auto !important;
                display: block !important;
              }
              @media print {
                body { margin: 0; padding: 10mm; }
                .no-print { display: none !important; }
                img { 
                  max-width: 100% !important;
                  height: auto !important;
                  page-break-inside: avoid;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
              @page {
                margin: 10mm;
                size: A4;
              }
            </style>
          </head>
          <body>${printElement.innerHTML}</body>
        </html>
      `)
      
      printWindow.document.close()
      printWindow.focus()
      
      // Attendre un peu que le contenu se charge avant d'imprimer
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success('Impression lancée !')
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error)
      toast.error('Erreur lors de l\'impression')
    }
  }

  const handleDuplicate = async () => {
    if (!template || !templateId) return
    
    try {
      const success = await duplicateTemplate(templateId)
      if (success) {
        toast.success('Template dupliqué avec succès !')
        router.push('/templates')
      }
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
      toast.error('Erreur lors de la duplication')
    }
  }

  const handleEdit = () => {
    router.push(`/templates/builder?id=${templateId}`)
  }

  if (loading) {
    return <PageLoading />
  }

  if (!template) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Template non trouvé</h1>
            <Button onClick={() => router.push('/templates')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux templates
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/templates')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{template.category}</Badge>
                    <span className="text-sm text-gray-600">
                      Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share className="h-4 w-4" />
                  Partager
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingPDF ? 'Génération...' : 'PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </Button>
                <Button
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Informations du template */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Nom</h4>
                    <p className="text-sm text-gray-900">{template.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{template.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Catégorie</h4>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Éléments</h4>
                    <p className="text-sm text-gray-600">
                      {template.elements?.length || 0} élément{(template.elements?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Dernière modification</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(template.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aperçu du template */}
            <div className="lg:col-span-3">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Aperçu du template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      ref={previewRef}
                      className="min-h-[800px] p-8 bg-white"
                      style={{
                        width: template.layout?.width || '210mm',
                        minHeight: template.layout?.height || '297mm',
                        margin: '0 auto',
                        padding: `${template.layout?.margin?.top || '20mm'} ${template.layout?.margin?.right || '20mm'} ${template.layout?.margin?.bottom || '20mm'} ${template.layout?.margin?.left || '20mm'}`
                      }}
                    >
                      {template.elements && template.elements.length > 0 ? (
                        <TemplateRenderer
                          elements={template.elements}
                          variables={mockVariables}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">
                              Template vide
                            </h3>
                            <p className="text-gray-500">
                              Ce template ne contient aucun élément
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 