'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PageLoading } from '@/components/ui/loading'
import { TemplateRenderer } from '@/components/invoices/template-renderer'
import { useInvoices, CreateInvoiceData } from '@/hooks/use-invoices'
import { useClients } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'
import { useInvoiceTemplates } from '@/hooks/use-invoice-templates'
import { useQuotes } from '@/hooks/use-quotes'
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  FileText,
  RefreshCw,
  FileCheck,
  Eye,
  Palette,
} from 'lucide-react'
import Link from 'next/link'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

// Composant pour gérer les paramètres de recherche
function CreateInvoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')
  const previewRef = useRef<HTMLDivElement>(null)
  
  const { createInvoice } = useInvoices()
  const { clients, fetchClients } = useClients()
  const { projects, fetchProjects } = useProjects()
  const { templates, fetchTemplates } = useInvoiceTemplates()
  const { quotes, fetchQuotes, fetchQuote } = useQuotes()

  const [loading, setLoading] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    number: '',
    clientId: clientId || '',
    projectId: '',
    templateId: '',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
    notes: '',
    status: 'DRAFT' as const,
    taxRate: 20,
  })

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 20 }
  ])

  useEffect(() => {
    fetchClients()
    fetchProjects()
    fetchTemplates()
    fetchQuotes()
  }, [])

  // Fonction pour pré-remplir la facture avec un devis
  const handleQuoteSelection = async (quoteId: string) => {
    if (!quoteId) {
      setSelectedQuoteId('')
      return
    }

    setSelectedQuoteId(quoteId)
    
    try {
      const quote = await fetchQuote(quoteId)
      if (!quote) return

      // Pré-remplir les données du formulaire
      setFormData(prev => ({
        ...prev,
        title: `Facture - ${quote.title}`,
        clientId: quote.clientId,
        projectId: quote.projectId || '',
        notes: quote.notes || '',
        taxRate: quote.taxRate || 20,
      }))

      // Pré-remplir les articles
      if (quote.items && quote.items.length > 0) {
        setItems(quote.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: quote.taxRate || 20,
        })))
      }
    } catch (error) {
      console.error('Erreur lors du chargement du devis:', error)
    }
  }

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setSelectedQuoteId('')
    setFormData({
      title: '',
      number: '',
      clientId: clientId || '',
      projectId: '',
      templateId: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: '',
      status: 'DRAFT' as const,
      taxRate: 20,
    })
    setItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }])
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, taxRate: 20 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    return item.quantity * item.unitPrice
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const calculateTaxAmount = () => {
    return items.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item)
      return sum + (itemTotal * item.taxRate / 100)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount()
  }

  // Fonction pour préparer les variables pour la prévisualisation
  const getPreviewVariables = () => {
    const selectedClient = clients.find(c => c.id === formData.clientId)
    const selectedProject = projects.find(p => p.id === formData.projectId)
    
    return {
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
        name: selectedClient?.name || 'Client non sélectionné',
        company: selectedClient?.company || '',
        address: selectedClient?.address || '',
        city: selectedClient?.city || '',
        country: 'France',
        email: selectedClient?.email || ''
      },
      invoice: {
        number: formData.number || 'FAC-PREVIEW-001',
        date: formData.issueDate.toLocaleDateString('fr-FR'),
        dueDate: formData.dueDate.toLocaleDateString('fr-FR'),
        total: calculateTotal().toFixed(2) + ' €',
        subtotal: calculateSubtotal().toFixed(2) + ' €',
        tax: calculateTaxAmount().toFixed(2) + ' €',
        taxRate: formData.taxRate
      },
      project: selectedProject ? {
        name: selectedProject.name,
        description: selectedProject.description
      } : undefined,
      items: items.filter(item => item.description.trim() !== '').map(item => {
        const itemTotalHT = calculateItemTotal(item)
        const itemTaxAmount = itemTotalHT * item.taxRate / 100
        const itemTotalTTC = itemTotalHT + itemTaxAmount
        
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotalHT, // Total HT
          totalTTC: itemTotalTTC, // Total TTC (HT + TVA)
          taxRate: item.taxRate,
          taxAmount: itemTaxAmount
        }
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      alert('Veuillez remplir tous les articles correctement')
      return
    }

    setLoading(true)
    try {
      const invoiceData: CreateInvoiceData = {
        title: formData.title || `Facture pour ${clients.find(c => c.id === formData.clientId)?.name}`,
        number: formData.number || undefined,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        issueDate: formData.issueDate.toISOString(),
        dueDate: formData.dueDate.toISOString(),
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        notes: formData.notes || undefined,
        status: formData.status,
        taxRate: formData.taxRate,
      }

      await createInvoice(invoiceData)
      router.push('/invoices')
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)
  const filteredProjects = projects.filter(p => p.client?.id === formData.clientId)
  
  // Filtrer les devis appropriés pour les proposer (DRAFT, SENT, ACCEPTED)
  const availableQuotes = quotes.filter(quote => 
    ['DRAFT', 'SENT', 'ACCEPTED'].includes(quote.status)
  )
  
  // Template sélectionné
  const selectedTemplate = templates.find(t => t.id === formData.templateId)

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/invoices">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux factures
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle facture</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Créez une nouvelle facture pour vos clients
              </p>
            </div>
          </div>
          
          {/* Bouton Prévisualisation */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-4">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>Aperçu de la facture</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {selectedTemplate ? (
                  <div 
                    ref={previewRef}
                    className="bg-white p-8 mx-auto"
                    style={{
                      width: (selectedTemplate.layout?.width as string) || '210mm',
                      minHeight: (selectedTemplate.layout?.height as string) || '297mm',
                      margin: '0 auto'
                    }}
                  >
                    <TemplateRenderer
                      elements={(selectedTemplate.elements as any) || []}
                      variables={getPreviewVariables()}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <div>
                      <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">
                        Aucun template sélectionné
                      </h3>
                      <p className="text-gray-500">
                        Sélectionnez un template pour voir l'aperçu
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection d'un devis (optionnel) */}
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 via-white to-green-50/30 dark:from-green-900/20 dark:via-slate-800 dark:to-green-900/10">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                <FileCheck className="h-5 w-5 mr-2" />
                Pré-remplir depuis un devis (optionnel)
              </CardTitle>
              <p className="text-sm text-green-600 dark:text-green-400">
                Sélectionnez un devis existant pour pré-remplir automatiquement cette facture
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select value={selectedQuoteId} onValueChange={handleQuoteSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un devis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableQuotes.length > 0 ? (
                        availableQuotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id}>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{quote.title}</span>
                                <Badge 
                                  variant={quote.status === 'ACCEPTED' ? 'default' : quote.status === 'SENT' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {quote.status === 'DRAFT' && 'Brouillon'}
                                  {quote.status === 'SENT' && 'Envoyé'}
                                  {quote.status === 'ACCEPTED' && 'Accepté'}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                {quote.client.name} • {quote.total.toFixed(2)}€ • {new Date(quote.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Aucun devis disponible</p>
                          <p className="text-xs">Créez d'abord un devis pour l'utiliser ici</p>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedQuoteId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="whitespace-nowrap"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}
              </div>
              
              {selectedQuoteId && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Facture pré-remplie depuis le devis sélectionné. Vous pouvez modifier tous les champs ci-dessous.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la facture</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Facture développement site web"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Numéro (optionnel)</Label>
                  <Input
                    id="number"
                    placeholder="Généré automatiquement si vide"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClient && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedClient.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Projet (optionnel)</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => handleInputChange('projectId', value)}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Template de facture</Label>
                <Select value={formData.templateId} onValueChange={(value) => handleInputChange('templateId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center space-x-2">
                          <Palette className="h-4 w-4" />
                          <span>{template.name}</span>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Par défaut
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Date d'émission</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('issueDate', new Date(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Date d'échéance</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('dueDate', new Date(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="SENT">Envoyée</SelectItem>
                      <SelectItem value="PAID">Payée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Articles</CardTitle>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[15%]">Quantité</TableHead>
                    <TableHead className="w-[15%]">Prix unitaire</TableHead>
                    <TableHead className="w-[10%]">TVA (%)</TableHead>
                    <TableHead className="w-[15%]">Total HT</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="Description de l'article"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {calculateItemTotal(item).toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totaux */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT:</span>
                    <span>{calculateSubtotal().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA:</span>
                    <span>{calculateTaxAmount().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span>{calculateTotal().toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes (optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notes supplémentaires, conditions de paiement..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/invoices">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la facture
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

// Composant principal avec Suspense boundary
export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    }>
      <CreateInvoiceContent />
    </Suspense>
  )
} 