'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Quote, CreateQuoteData, UpdateQuoteData, QuoteItem } from '@/hooks/use-quotes'
import { useClients } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'
import { 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Users, 
  Calendar, 
  Settings,
  Eye,
  Check,
  AlertCircle,
  Building2,
  Euro,
  Hash
} from 'lucide-react'

interface QuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote?: Quote
  onSubmit: (data: CreateQuoteData | UpdateQuoteData) => Promise<void>
}

interface FormData {
  title: string
  description: string
  clientId: string
  projectId: string
  validUntil: string
  taxRate: number
  currency: string
  notes: string
  items: QuoteItem[]
}



export function QuoteModal({ open, onOpenChange, quote, onSubmit }: QuoteModalProps) {
  const { clients } = useClients()
  const { projects, refetch: refetchProjects } = useProjects()
  const [loading, setLoading] = useState(false)

  // Helper pour obtenir le symbole de devise
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'EUR': return '€'
      case 'USD': return '$'
      case 'GBP': return '£'
      case 'CHF': return 'CHF'
      default: return currency
    }
  }
  
  // Initialiser les données du formulaire
  const getInitialData = (): FormData => {
    if (quote) {
      return {
        title: quote.title,
        description: quote.description || '',
        clientId: quote.clientId,
        projectId: quote.projectId || 'none',
        validUntil: new Date(quote.validUntil).toISOString().split('T')[0],
        taxRate: quote.taxRate,
        currency: quote.currency,
        notes: quote.notes || '',
        items: quote.items,
      }
    }
    
    return {
      title: '',
      description: '',
      clientId: '',
      projectId: 'none',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
      taxRate: 20,
      currency: 'EUR',
      notes: '',
      items: [],
    }
  }

  const [formData, setFormData] = useState<FormData>(getInitialData)

  // Réinitialiser le formulaire quand la modal s'ouvre/ferme ou que le devis change
  useEffect(() => {
    if (open) {
      setFormData(getInitialData())
      // Recharger les projets pour avoir la liste à jour
      refetchProjects()
    }
  }, [open, quote])

  // Mettre à jour l'affichage de la devise dans le formulaire d'ajout
  useEffect(() => {
    const totalElement = document.getElementById('new-item-total')
    if (totalElement && open) {
      const quantity = parseInt((document.getElementById('new-item-quantity') as HTMLInputElement)?.value || '1')
      const unitPrice = parseFloat((document.getElementById('new-item-price') as HTMLInputElement)?.value || '0')
      const total = quantity * unitPrice
      totalElement.textContent = `${total.toFixed(2)} ${getCurrencySymbol(formData.currency)}`
    }
  }, [formData.currency, open])

  // Filtrer les projets du client sélectionné
  const clientProjects = projects.filter(project => project.client?.id === formData.clientId)

  // Calculer les totaux
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = (subtotal * formData.taxRate) / 100
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  // Validation en temps réel
  const isFormValid = formData.title.trim() && formData.clientId
  const hasValidItems = formData.items.length === 0 || formData.items.every(item => item.description?.trim() && item.quantity > 0 && item.unitPrice >= 0)

  // Gérer les changements d'éléments
  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalculer le total pour cet élément
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setFormData({ ...formData, items: newItems })
  }



  // Supprimer un élément
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({ ...formData, items: newItems })
    }
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.clientId || formData.items.length === 0) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        clientId: formData.clientId,
        projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
        validUntil: formData.validUntil,
        taxRate: formData.taxRate,
        currency: formData.currency,
        notes: formData.notes.trim() || undefined,
        items: formData.items.map(item => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }

      // Debug logs côté frontend
      console.log('🔍 Debug soumission devis:')
      console.log('- formData.clientId:', formData.clientId)
      console.log('- submitData:', JSON.stringify(submitData, null, 2))

      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      // L'erreur est gérée dans le hook
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl 2xl:max-w-[95vw] w-full max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {quote ? 'Modifier le devis' : 'Nouveau devis'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {quote ? 'Modifiez les informations de votre devis' : 'Créez une nouvelle proposition commerciale'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col 2xl:grid 2xl:grid-cols-5 gap-8 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Formulaire principal */}
          <div className="2xl:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Informations</span>
                  </TabsTrigger>
                  <TabsTrigger value="items" className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4" />
                    <span>Éléments</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Informations */}
                <TabsContent value="info" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <FileText className="w-5 h-5 mr-2" />
                        Détails du devis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center">
                          Titre du devis *
                          {formData.title.trim() && <Check className="w-4 h-4 ml-2 text-green-500" />}
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Ex: Développement site web e-commerce"
                          className={formData.title.trim() ? 'border-green-200' : ''}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description du projet</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Décrivez les objectifs, le contexte et les spécificités de ce devis..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="validUntil" className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date d'expiration *
                        </Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={formData.validUntil}
                          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Le devis expirera automatiquement après cette date
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Users className="w-5 h-5 mr-2" />
                        Client et projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientId" className="flex items-center">
                          Client *
                          {formData.clientId && <Check className="w-4 h-4 ml-2 text-green-500" />}
                        </Label>
                        <Select
                          value={formData.clientId}
                          onValueChange={(value) => setFormData({ ...formData, clientId: value, projectId: 'none' })}
                        >
                          <SelectTrigger className={formData.clientId ? 'border-green-200' : ''}>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                <div className="flex items-center space-x-2">
                                  <Building2 className="w-4 h-4" />
                                  <span>{client.name}</span>
                                  {client.company && <Badge variant="outline">{client.company}</Badge>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="projectId">Projet associé (optionnel)</Label>
                          {formData.clientId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => refetchProjects()}
                              className="h-6 text-xs"
                            >
                              🔄 Actualiser
                            </Button>
                          )}
                        </div>
                        <Select
                          value={formData.projectId}
                          onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                          disabled={!formData.clientId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun projet</SelectItem>
                            {clientProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4" />
                                  <span>{project.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!formData.clientId && (
                          <p className="text-xs text-muted-foreground">
                            Sélectionnez d'abord un client pour voir ses projets
                          </p>
                        )}
                        {formData.clientId && clientProjects.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Aucun projet trouvé pour ce client. Créez un projet dans la section Projets.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Éléments */}
                <TabsContent value="items" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Éléments du devis
                        <Badge variant="secondary" className="ml-2">
                          {formData.items.length} élément{formData.items.length > 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                                        <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Formulaire d'ajout d'élément */}
                        <div className="p-5 rounded-lg bg-accent/20 border-2 border-dashed border-primary/30 space-y-4">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un nouvel élément
                          </h4>
                          
                          {/* Ligne 1 : Description */}
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Description *
                            </Label>
                            <Input
                              id="new-item-description"
                              placeholder="Ex: Développement page d'accueil"
                              className="h-11"
                            />
                          </div>
                          
                          {/* Ligne 2 : Quantité + Prix + Total */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Quantité */}
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Quantité
                              </Label>
                              <Input
                                id="new-item-quantity"
                                type="number"
                                min="1"
                                step="1"
                                defaultValue="1"
                                className="h-11 text-center"
                                onChange={() => {
                                  const quantity = parseInt((document.getElementById('new-item-quantity') as HTMLInputElement)?.value || '1')
                                  const unitPrice = parseFloat((document.getElementById('new-item-price') as HTMLInputElement)?.value || '0')
                                  const total = quantity * unitPrice
                                  ;(document.getElementById('new-item-total') as HTMLElement).textContent = `${total.toFixed(2)} ${getCurrencySymbol(formData.currency)}`
                                }}
                              />
                            </div>
                            
                            {/* Prix unitaire */}
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Prix unitaire
                              </Label>
                              <div className="relative">
                                <Input
                                  id="new-item-price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue="0"
                                  className="h-11 text-center pr-8"
                                  onChange={() => {
                                    const quantity = parseInt((document.getElementById('new-item-quantity') as HTMLInputElement)?.value || '1')
                                    const unitPrice = parseFloat((document.getElementById('new-item-price') as HTMLInputElement)?.value || '0')
                                    const total = quantity * unitPrice
                                    ;(document.getElementById('new-item-total') as HTMLElement).textContent = `${total.toFixed(2)} ${getCurrencySymbol(formData.currency)}`
                                  }}
                                />
                                                                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                    {getCurrencySymbol(formData.currency)}
                                  </span>
                              </div>
                            </div>
                            
                            {/* Total calculé */}
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Total
                              </Label>
                              <div className="h-11 bg-muted/50 rounded-md border flex items-center justify-center">
                                <span className="text-lg font-semibold" id="new-item-total">
                                  0,00 {getCurrencySymbol(formData.currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Bouton d'ajout en dessous */}
                          <div className="pt-2">
                            <Button 
                              type="button" 
                              onClick={() => {
                                const description = (document.getElementById('new-item-description') as HTMLInputElement)?.value || ''
                                const quantity = parseInt((document.getElementById('new-item-quantity') as HTMLInputElement)?.value || '1')
                                const unitPrice = parseFloat((document.getElementById('new-item-price') as HTMLInputElement)?.value || '0')
                                
                                if (description.trim()) {
                                  // Ajouter directement l'élément avec les bonnes valeurs
                                  const newItem = {
                                    description,
                                    quantity,
                                    unitPrice,
                                    total: quantity * unitPrice
                                  }
                                  
                                  setFormData({
                                    ...formData,
                                    items: [...formData.items, newItem]
                                  })
                                  
                                  // Reset form
                                  ;(document.getElementById('new-item-description') as HTMLInputElement).value = ''
                                  ;(document.getElementById('new-item-quantity') as HTMLInputElement).value = '1'
                                  ;(document.getElementById('new-item-price') as HTMLInputElement).value = '0'
                                  ;(document.getElementById('new-item-total') as HTMLElement).textContent = `0,00 ${getCurrencySymbol(formData.currency)}`
                                }
                              }}
                              className="w-full h-11"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Ajouter l'élément
                            </Button>
                          </div>
                        </div>

                        {/* Liste des éléments ajoutés */}
                        {formData.items.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                Éléments ajoutés
                              </h4>
                              <Badge variant="secondary">
                                {formData.items.length} élément{formData.items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              {formData.items.map((item, index) => (
                                <div key={index} className="group">
                                  <div className="p-4 rounded-lg border border-border/40 hover:border-border/80 hover:bg-accent/10 transition-all duration-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {item.description || <span className="text-muted-foreground italic">Sans description</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {item.quantity} × {item.unitPrice.toFixed(2)} {getCurrencySymbol(formData.currency)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <div className="font-semibold">
                                            {item.total.toFixed(2)} {getCurrencySymbol(formData.currency)}
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(index)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!hasValidItems && formData.items.length > 0 && (
                        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-sm">Veuillez remplir tous les champs obligatoires des éléments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Onglet Paramètres */}
                <TabsContent value="settings" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Paramètres financiers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="taxRate" className="flex items-center">
                            <Hash className="w-4 h-4 mr-2" />
                            Taux de TVA (%)
                          </Label>
                          <Input
                            id="taxRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.taxRate}
                            onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency" className="flex items-center">
                            <Euro className="w-4 h-4 mr-2" />
                            Devise
                          </Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData({ ...formData, currency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="CHF">CHF</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notes complémentaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes internes (optionnel)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Notes internes, conditions particulières, informations complémentaires..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {!isFormValid && (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Veuillez remplir les champs obligatoires</span>
                    </>
                  )}
                  {isFormValid && hasValidItems && (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Formulaire valide</span>
                    </>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !isFormValid || !hasValidItems}
                    className="min-w-[120px]"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Création...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>{quote ? 'Mettre à jour' : 'Créer le devis'}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Panneau de prévisualisation */}
          <div className="2xl:col-span-2">
            <div className="2xl:sticky 2xl:top-6">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Eye className="w-5 h-5 mr-2" />
                    Aperçu en temps réel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Simulation du document de devis */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
                    {/* En-tête */}
                    <div className="border-b pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">DEVIS</div>
                          <div className="text-sm text-muted-foreground mt-1">N° [Auto-généré]</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date().toLocaleDateString('fr-FR')}
                          </div>
                          {formData.validUntil && (
                            <div className="text-xs text-muted-foreground">
                              Valide jusqu'au {new Date(formData.validUntil).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {formData.title ? (
                        <h2 className="text-xl font-bold mt-3 text-gray-900">{formData.title}</h2>
                      ) : (
                        <div className="h-6 bg-gray-200 rounded animate-pulse mt-3" />
                      )}
                    </div>

                    {/* Client */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">FACTURER À</h3>
                        {formData.clientId ? (
                          <div className="text-sm space-y-1">
                            <div className="font-medium">{clients.find(c => c.id === formData.clientId)?.name}</div>
                            {clients.find(c => c.id === formData.clientId)?.company && (
                              <div className="text-gray-600">
                                {clients.find(c => c.id === formData.clientId)?.company}
                              </div>
                            )}
                            {clients.find(c => c.id === formData.clientId)?.email && (
                              <div className="text-gray-600">
                                {clients.find(c => c.id === formData.clientId)?.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                          </div>
                        )}
                      </div>
                      
                      {formData.projectId && formData.projectId !== 'none' && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">PROJET</h3>
                          <div className="text-sm">
                            {clientProjects.find(p => p.id === formData.projectId)?.name}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {formData.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">DESCRIPTION</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{formData.description}</p>
                      </div>
                    )}

                    {/* Tableau des éléments */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">DÉTAIL DES PRESTATIONS</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="text-xs text-gray-600 uppercase tracking-wider">
                              <th className="text-left py-2 px-3">Description</th>
                              <th className="text-center py-2 px-3 w-16">Qté</th>
                              <th className="text-right py-2 px-3 w-24">P.U.</th>
                              <th className="text-right py-2 px-3 w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {formData.items.filter(item => item.description.trim()).map((item, index) => (
                              <tr key={index} className="text-sm">
                                <td className="py-3 px-3">{item.description}</td>
                                <td className="py-3 px-3 text-center">{item.quantity}</td>
                                <td className="py-3 px-3 text-right">{item.unitPrice.toFixed(2)} {getCurrencySymbol(formData.currency)}</td>
                                <td className="py-3 px-3 text-right font-medium">{item.total.toFixed(2)} {getCurrencySymbol(formData.currency)}</td>
                              </tr>
                            ))}
                            {formData.items.filter(item => item.description.trim()).length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                                  Aucun élément ajouté
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Totaux */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total HT</span>
                          <span>{subtotal.toFixed(2)} {getCurrencySymbol(formData.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>TVA ({formData.taxRate}%)</span>
                          <span>{taxAmount.toFixed(2)} {getCurrencySymbol(formData.currency)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total TTC</span>
                          <span>{total.toFixed(2)} {getCurrencySymbol(formData.currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {formData.notes && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">NOTES</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 