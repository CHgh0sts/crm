'use client'

import { useState, useEffect } from 'react'
import { useInvoiceTemplates, InvoiceTemplate } from '@/hooks/use-invoice-templates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import {
  FileText,
  Palette,
  Briefcase,
  Zap,
  Users,
  Sparkles,
  Crown,
  Eye,
  Check,
} from 'lucide-react'

const categoryConfig = {
  BUSINESS: { label: 'Entreprise', icon: Briefcase, color: 'bg-blue-500' },
  CREATIVE: { label: 'Créatif', icon: Palette, color: 'bg-purple-500' },
  MINIMAL: { label: 'Minimaliste', icon: Zap, color: 'bg-gray-500' },
  PROFESSIONAL: { label: 'Professionnel', icon: Users, color: 'bg-green-500' },
  MODERN: { label: 'Moderne', icon: Sparkles, color: 'bg-pink-500' },
  CLASSIC: { label: 'Classique', icon: Crown, color: 'bg-orange-500' },
}

interface TemplateSelectorProps {
  selectedTemplateId?: string
  onTemplateSelect?: (templateId: string) => void
  onSave?: (templateId: string) => void
}

function TemplatePreviewCard({ template, isSelected, onSelect, onPreview }: {
  template: InvoiceTemplate
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  const categoryInfo = categoryConfig[template.category]
  const CategoryIcon = categoryInfo.icon

  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
              <CategoryIcon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
              <div className="flex items-center space-x-1 mt-1">
                <Badge variant="outline" className="text-xs">{categoryInfo.label}</Badge>
                {template.isDefault && <Badge variant="default" className="text-xs">Par défaut</Badge>}
                {template.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              className="h-6 w-6 p-0"
            >
              <Eye className="w-3 h-3" />
            </Button>
            {isSelected && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0" onClick={onSelect}>
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {template.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground">
          {template._count.invoices} facture(s) • v{template.version}
        </div>
      </CardContent>
    </Card>
  )
}

export function TemplateSelector({ selectedTemplateId, onTemplateSelect, onSave }: TemplateSelectorProps) {
  const { templates, loading, fetchTemplates } = useInvoiceTemplates()
  const [selected, setSelected] = useState<string>(selectedTemplateId || '')

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplateId) {
      setSelected(selectedTemplateId)
    }
  }, [selectedTemplateId])

  const handleTemplateSelect = (templateId: string) => {
    setSelected(templateId)
    onTemplateSelect?.(templateId)
  }

  const handleSave = () => {
    if (selected) {
      onSave?.(selected)
    }
  }

  const handlePreview = (template: InvoiceTemplate) => {
    window.open(`/templates/preview?id=${template.id}`, '_blank')
  }

  if (loading) {
    return <PageLoading />
  }

  // Séparer les templates par type
  const publicTemplates = templates.filter(t => t.isPublic)
  const personalTemplates = templates.filter(t => !t.isPublic)

  return (
    <div className="space-y-6">
      {/* Templates publics */}
      {publicTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Templates par défaut
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicTemplates.map(template => (
              <TemplatePreviewCard
                key={template.id}
                template={template}
                isSelected={selected === template.id}
                onSelect={() => handleTemplateSelect(template.id)}
                onPreview={() => handlePreview(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Templates personnels */}
      {personalTemplates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Mes templates personnels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalTemplates.map(template => (
              <TemplatePreviewCard
                key={template.id}
                template={template}
                isSelected={selected === template.id}
                onSelect={() => handleTemplateSelect(template.id)}
                onPreview={() => handlePreview(template)}
              />
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun template disponible</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre premier template ou initialisez les templates par défaut.
          </p>
          <Button onClick={() => window.location.href = '/invoices'}>
            Gérer les templates
          </Button>
        </div>
      )}

      {/* Actions */}
      {templates.length > 0 && onSave && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selected ? `Template sélectionné : ${templates.find(t => t.id === selected)?.name}` : 'Aucun template sélectionné'}
          </div>
          <Button
            onClick={handleSave}
            disabled={!selected}
          >
            Enregistrer la sélection
          </Button>
        </div>
      )}
    </div>
  )
} 