'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import { useInvoiceTemplates, InvoiceTemplate } from '@/hooks/use-invoice-templates'
import { TemplateInitButton } from '@/components/invoices/template-init-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileText,
  Palette,
  Briefcase,
  Zap,
  Users,
  Sparkles,
  Crown,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

const categoryConfig = {
  BUSINESS: { label: 'Entreprise', icon: Briefcase, color: 'bg-blue-500' },
  CREATIVE: { label: 'Créatif', icon: Palette, color: 'bg-purple-500' },
  MINIMAL: { label: 'Minimaliste', icon: Zap, color: 'bg-gray-500' },
  PROFESSIONAL: { label: 'Professionnel', icon: Users, color: 'bg-green-500' },
  MODERN: { label: 'Moderne', icon: Sparkles, color: 'bg-pink-500' },
  CLASSIC: { label: 'Classique', icon: Crown, color: 'bg-orange-500' },
}

function TemplateCard({ template, onView, onEdit, onDuplicate, onDelete }: { 
  template: InvoiceTemplate
  onView: (template: InvoiceTemplate) => void
  onEdit: (template: InvoiceTemplate) => void
  onDuplicate: (template: InvoiceTemplate) => void
  onDelete: (template: InvoiceTemplate) => void
}) {
  const router = useRouter()
  const categoryInfo = categoryConfig[template.category]
  const CategoryIcon = categoryInfo.icon

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔍 Clic sur la carte du template:', template.name, 'ID:', template.id)
    onView(template)
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Card 
      data-template-card={template.id}
      className="relative group hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50 hover:shadow-xl max-w-sm w-full h-auto" 
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 relative z-10">
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
            <CategoryIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate hover:text-primary transition-colors text-gray-900 dark:text-white">
              {template.name}
            </CardTitle>
            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {template.description}
              </p>
            )}
          </div>
        </div>
        
        <div onClick={handleDropdownClick} className="relative z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(template)}>
                <Eye className="mr-2 h-4 w-4" />
                Prévisualiser
              </DropdownMenuItem>
              {!template.isPublic && (
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
              {!template.isPublic && template._count.invoices === 0 && (
                <DropdownMenuItem 
                  onClick={() => onDelete(template)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {/* Badges de catégorie et type */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {categoryInfo.label}
          </Badge>
          {template.isDefault && (
            <Badge variant="default">
              Par défaut
            </Badge>
          )}
          {template.isPublic && (
            <Badge variant="secondary">
              Public
            </Badge>
          )}
          {!template.isPublic && (
            <Badge variant="outline">
              Personnel
            </Badge>
          )}
        </div>

        {/* Informations d'utilisation */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {template._count.invoices} facture(s)
            </span>
            <span>v{template.version}</span>
          </div>
          <span>
            {template.user ? (
              `Créé par ${template.user.firstName} ${template.user.lastName}`
            ) : (
              'Template système'
            )}
          </span>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          Mis à jour {formatDistanceToNow(new Date(template.updatedAt), { 
            addSuffix: true, 
            locale: fr 
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const { 
    templates, 
    loading, 
    error, 
    fetchTemplates, 
    deleteTemplate, 
    duplicateTemplate,
    hasDefaultTemplates
  } = useInvoiceTemplates()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Debug: Ajouter un gestionnaire de clic global pour diagnostiquer
  useEffect(() => {
    const handleGlobalClick = (e: Event) => {
      const target = e.target as Element
      console.log('🌐 Clic global détecté sur:', target?.tagName, target?.className)
      
      // Vérifier si c'est un clic sur une carte de template
      const cardElement = target.closest('[data-template-card]')
      if (cardElement) {
        const templateId = cardElement.getAttribute('data-template-card')
        console.log('🎯 Clic détecté sur une carte de template! ID:', templateId)
        
        // Diagnostic des dimensions de la carte
        const rect = cardElement.getBoundingClientRect()
        console.log('📐 Dimensions de la carte:', {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        })
        
        // Vérifier si la carte a des dimensions anormales
        if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.8) {
          console.error('⚠️ CARTE ANORMALEMENT GRANDE DÉTECTÉE!')
        }
      }
    }
    
    document.addEventListener('click', handleGlobalClick, true)
    return () => document.removeEventListener('click', handleGlobalClick, true)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'public' && template.isPublic) ||
                       (typeFilter === 'personal' && !template.isPublic)
    
    return matchesSearch && matchesCategory && matchesType
  })

  const handleViewTemplate = (template: InvoiceTemplate) => {
    router.push(`/templates/preview?id=${template.id}`)
  }

  const handleEditTemplate = (template: InvoiceTemplate) => {
    router.push(`/templates/builder?id=${template.id}`)
  }

  const handleDuplicateTemplate = async (template: InvoiceTemplate) => {
    try {
      await duplicateTemplate(template.id, `Copie de ${template.name}`)
      await fetchTemplates() // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
    }
  }

  const handleDeleteTemplate = async (template: InvoiceTemplate) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) {
      try {
        await deleteTemplate(template.id)
        await fetchTemplates() // Rafraîchir la liste
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleCreateTemplate = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    console.log('🔧 Début création nouveau template')
    console.log('🔧 URL actuelle:', window.location.href)
    console.log('🔧 Tentative de redirection vers /templates/builder')
    
    // Force la navigation
    const targetUrl = '/templates/builder'
    console.log('🔧 Navigation forcée vers:', targetUrl)
    
    // Tentative avec router.push
    try {
      router.push(targetUrl)
      console.log('✅ Navigation router.push envoyée')
      
      // Vérification après un délai
      setTimeout(() => {
        if (window.location.pathname !== '/templates/builder') {
          console.log('🔄 Router.push a échoué, utilisation de window.location.href')
          window.location.href = targetUrl
        }
      }, 100)
    } catch (error) {
      console.error('❌ Erreur router.push:', error)
      console.log('🔄 Utilisation de window.location.href comme fallback')
      window.location.href = targetUrl
    }
  }

  // Statistiques
  const stats = {
    total: templates.length,
    public: templates.filter(t => t.isPublic).length,
    personal: templates.filter(t => !t.isPublic).length,
    categories: new Set(templates.map(t => t.category)).size,
  }

  if (loading) return <PageLoading />
  if (error) return <div>Erreur: {error}</div>

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates de factures</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez vos modèles de factures et créez de nouveaux designs
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleCreateTemplate} 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300 border-2 border-blue-500 hover:border-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />Nouveau template
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publics</p>
                  <p className="text-2xl font-bold text-green-600">{stats.public}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Personnels</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.personal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                  <Palette className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Catégories</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.categories}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <config.icon className="w-4 h-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="public">Templates publics</SelectItem>
                  <SelectItem value="personal">Templates personnels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <FileText className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucun template trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'Aucun template ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre premier template de facture.'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onView={handleViewTemplate}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
} 