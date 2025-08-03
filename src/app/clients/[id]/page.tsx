'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading'
import { useClient, Client } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'
import { useQuotes, CreateQuoteData } from '@/hooks/use-quotes'
import { useContacts, CreateContactData } from '@/hooks/use-contacts'
import { useInteractions, CreateInteractionData } from '@/hooks/use-interactions'
import { useEmails } from '@/hooks/use-emails'
import { ClientModal } from '@/components/clients/client-modal'
import { ProjectModal } from '@/components/projects/project-modal'
import { QuoteModal } from '@/components/quotes/quote-modal'
import { ContactModal } from '@/components/clients/contact-modal'
import { InteractionModal } from '@/components/clients/interaction-modal'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  Target,
  Plus,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Clock,
  TrendingUp,
  User,
  Briefcase
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { toast } from 'sonner'

const statusConfig = {
  ACTIVE: { label: 'Actif', color: 'bg-green-500', variant: 'default' as const },
  INACTIVE: { label: 'Inactif', color: 'bg-gray-500', variant: 'secondary' as const },
  PROSPECT: { label: 'Prospect', color: 'bg-blue-500', variant: 'default' as const },
}

function formatCurrency(amount: number, currency: string = 'EUR') {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

function getInitials(name: string): string {
  if (!name) return 'CL'
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

function formatDate(date: string | Date) {
  try {
    return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
  } catch {
    return new Date(date).toLocaleDateString('fr-FR')
  }
}

export default function ClientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { client, loading, error, refetch } = useClient(clientId)
  const { createProject } = useProjects()
  const { createQuote } = useQuotes()
  const { createContact } = useContacts(clientId)
  const { createInteraction } = useInteractions(clientId)
  const { createEmail } = useEmails()
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Actions handlers
  const handleCreateProject = async () => {
    setProjectModalOpen(true)
  }

  const handleCreateQuote = () => {
    setQuoteModalOpen(true)
  }

  const handleCreateInvoice = () => {
    router.push(`/invoices/create?clientId=${clientId}`)
  }

  const handleAddContact = () => {
    setContactModalOpen(true)
  }

  const handleAddInteraction = () => {
    setInteractionModalOpen(true)
  }

  const handleSendProspectEmail = async () => {
    if (!client?.email) {
      toast.error('Aucun email renseigné pour ce client')
      return
    }

    const prospectEmailTemplate = {
      subject: `Découvrez nos services - ${client.company || client.name}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Bonjour ${client.name} !</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Découvrez comment nous pouvons vous aider</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              Nous avons remarqué votre intérêt pour nos services ${client.company ? `chez ${client.company}` : ''} et souhaitons vous présenter comment nous pouvons vous accompagner dans vos projets.
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">🚀 Nos domaines d'expertise :</h3>
              <ul style="color: #555; margin: 15px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Développement d'applications web et mobile</li>
                <li style="margin-bottom: 8px;">Consulting et stratégie digitale</li>
                <li style="margin-bottom: 8px;">Gestion de projets et accompagnement</li>
                <li style="margin-bottom: 8px;">Solutions sur mesure adaptées à vos besoins</li>
              </ul>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #1976d2;">💡 Offre spéciale prospect</h4>
              <p style="margin-bottom: 0; color: #555;">
                Pour votre première collaboration, bénéficiez d'un audit gratuit de vos besoins et d'une proposition personnalisée sans engagement.
              </p>
            </div>

            <p style="font-size: 16px; color: #333; margin: 25px 0;">
              Nous serions ravis d'échanger avec vous pour mieux comprendre vos enjeux et vous proposer des solutions adaptées.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@entreprise.com'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                📅 Planifier un échange
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 25px; margin-top: 35px;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                Cordialement,<br>
                <strong>L'équipe commerciale</strong><br>
                <span style="color: #999;">Votre partenaire pour la réussite de vos projets digitaux</span>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">Cet email de prospection a été envoyé car vous êtes enregistré comme prospect dans notre CRM.</p>
          </div>
        </div>
      `,
      textContent: `
Bonjour ${client.name},

Nous avons remarqué votre intérêt pour nos services ${client.company ? `chez ${client.company}` : ''} et souhaitons vous présenter comment nous pouvons vous accompagner dans vos projets.

Nos domaines d'expertise :
- Développement d'applications web et mobile
- Consulting et stratégie digitale  
- Gestion de projets et accompagnement
- Solutions sur mesure adaptées à vos besoins

Offre spéciale prospect : Pour votre première collaboration, bénéficiez d'un audit gratuit de vos besoins et d'une proposition personnalisée sans engagement.

Nous serions ravis d'échanger avec vous pour mieux comprendre vos enjeux et vous proposer des solutions adaptées.

N'hésitez pas à nous contacter : ${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@entreprise.com'}

Cordialement,
L'équipe commerciale
      `
    }

    try {
      const success = await createEmail({
        to: client.email,
        toName: client.name,
        subject: prospectEmailTemplate.subject,
        htmlContent: prospectEmailTemplate.htmlContent,
        textContent: prospectEmailTemplate.textContent,
        clientId: client.id,
        sendNow: true
      })

      if (success) {
        toast.success('Email de prospection envoyé avec succès !')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email de prospection')
    }
  }

  useEffect(() => {
    if (error && mounted) {
      router.push('/clients')
    }
  }, [error, router, mounted])

  if (loading || !mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Client introuvable</h2>
          <p className="text-gray-600 mt-2">Ce client n'existe pas ou vous n'avez pas les droits d'accès.</p>
          <Button onClick={() => router.push('/clients')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/clients')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={''} alt={client.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                {client.company && (
                  <p className="text-gray-600">{client.company}</p>
                )}
              </div>
              <Badge 
                variant={statusConfig[client.status].variant}
                className={`${statusConfig[client.status].color} text-white`}
              >
                {statusConfig[client.status].label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bouton d'email de prospection (visible seulement pour les prospects) */}
            {client.status === 'PROSPECT' && client.email && (
              <Button 
                onClick={handleSendProspectEmail}
                className="bg-green-600 hover:bg-green-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email de prospection
              </Button>
            )}
            <Button 
              onClick={() => setClientModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setClientModalOpen(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                {client.status === 'PROSPECT' && client.email && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSendProspectEmail}>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer email de prospection
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mounted ? formatCurrency(client.stats?.totalRevenue || 0) : `${client.stats?.totalRevenue || 0} €`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.stats?.projectsCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Factures</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.stats?.invoicesCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.stats?.contactsCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {client.website}
                      </a>
                    </div>
                  )}
                  {(client.address || client.city || client.postalCode || client.country) && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        {client.address && <div>{client.address}</div>}
                        {(client.city || client.postalCode) && (
                          <div>
                            {client.postalCode} {client.city}
                          </div>
                        )}
                        {client.country && <div>{client.country}</div>}
                      </div>
                    </div>
                  )}
                  {client.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activité récente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Client créé le {mounted ? formatDate(client.createdAt) : new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    {client.stats?.lastInteraction && (
                      <div className="text-sm text-gray-600">
                        Dernière interaction : {mounted ? formatDate(client.stats.lastInteraction) : new Date(client.stats.lastInteraction).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Projets du client</CardTitle>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleCreateProject}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau projet
                </Button>
              </CardHeader>
              <CardContent>
                {client.projects && client.projects.length > 0 ? (
                  <div className="space-y-3">
                    {client.projects.map((project) => (
                      <Link 
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">
                              Priorité: {project.priority} • Avancement: {project.progress}%
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            style={{ backgroundColor: project.color }}
                            className="text-white"
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun projet pour ce client</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Factures et devis</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCreateQuote}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau devis
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleCreateInvoice}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle facture
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Devis */}
                  {client.quotes && client.quotes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Devis</h4>
                      <div className="space-y-2">
                        {client.quotes.map((quote) => (
                          <div key={quote.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">{quote.number}</span>
                              <span className="mx-2">•</span>
                              <span>{quote.title}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{mounted ? formatCurrency(quote.total) : `${quote.total} €`}</span>
                              <Badge variant="secondary">{quote.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Factures */}
                  {client.invoices && client.invoices.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Factures</h4>
                      <div className="space-y-2">
                        {client.invoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-medium">{invoice.number}</span>
                              <span className="mx-2">•</span>
                              <span>{invoice.title}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{mounted ? formatCurrency(invoice.total) : `${invoice.total} €`}</span>
                              <Badge variant="secondary">{invoice.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!client.invoices || client.invoices.length === 0) && 
                   (!client.quotes || client.quotes.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune facture ou devis pour ce client</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddContact}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un contact
                </Button>
              </CardHeader>
              <CardContent>
                {client.contacts && client.contacts.length > 0 ? (
                  <div className="space-y-3">
                    {client.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(`${contact.firstName} ${contact.lastName || ''}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {contact.firstName} {contact.lastName}
                              {contact.isPrimary && (
                                <Badge variant="secondary" className="ml-2">Principal</Badge>
                              )}
                            </div>
                            {contact.position && (
                              <div className="text-sm text-gray-600">{contact.position}</div>
                            )}
                            <div className="text-sm text-gray-600">
                              {contact.email && <span>{contact.email}</span>}
                              {contact.email && contact.phone && <span> • </span>}
                              {contact.phone && <span>{contact.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun contact pour ce client</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Interactions</CardTitle>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleAddInteraction}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une interaction
                </Button>
              </CardHeader>
              <CardContent>
                {client.interactions && client.interactions.length > 0 ? (
                  <div className="space-y-3">
                    {client.interactions.map((interaction) => (
                      <div key={interaction.id} className="p-4 border rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{interaction.type}</Badge>
                            <span className="font-medium">{interaction.subject}</span>
                          </div>
                                                      <span className="text-sm text-gray-500">
                              {mounted ? formatDate(interaction.date) : new Date(interaction.date).toLocaleDateString()}
                            </span>
                        </div>
                        {interaction.description && (
                          <p className="text-gray-600 text-sm">{interaction.description}</p>
                        )}
                        {interaction.contact && (
                          <p className="text-sm text-gray-500 mt-2">
                            Contact: {interaction.contact.firstName} {interaction.contact.lastName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune interaction enregistrée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de modification du client */}
      {clientModalOpen && (
        <ClientModal
          open={clientModalOpen}
          onOpenChange={setClientModalOpen}
          onSubmit={async () => {
            setClientModalOpen(false)
            refetch()
          }}
          client={client}
        />
      )}

      {/* Modal de création de projet */}
      {projectModalOpen && (
        <ProjectModal
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
          onSubmit={async (projectData) => {
            try {
              await createProject({
                ...projectData,
                clientId: clientId
              })
              setProjectModalOpen(false)
              refetch() // Rafraîchir les données du client
            } catch (error) {
              console.error('Erreur lors de la création du projet:', error)
            }
          }}
          project={{ clientId: clientId } as any}
        />
      )}

      {/* Modal de création de devis */}
      {quoteModalOpen && (
        <QuoteModal
          open={quoteModalOpen}
          onOpenChange={setQuoteModalOpen}
          onSubmit={async (quoteData) => {
            try {
              // Le QuoteModal nous donne soit CreateQuoteData soit UpdateQuoteData
              // On s'assure que c'est pour la création avec le bon clientId
              const dataToSubmit = {
                ...quoteData,
                clientId: clientId
              } as CreateQuoteData
              
              await createQuote(dataToSubmit)
              setQuoteModalOpen(false)
              refetch() // Rafraîchir les données du client
            } catch (error) {
              console.error('Erreur lors de la création du devis:', error)
            }
          }}
        />
      )}

      {/* Modal de création de contact */}
      {contactModalOpen && (
        <ContactModal
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          clientId={clientId}
          onSubmit={async (contactData) => {
            try {
              await createContact(contactData)
              setContactModalOpen(false)
              refetch() // Rafraîchir les données du client
            } catch (error) {
              console.error('Erreur lors de la création du contact:', error)
            }
          }}
        />
      )}

      {interactionModalOpen && (
        <InteractionModal
          open={interactionModalOpen}
          onOpenChange={setInteractionModalOpen}
          onSubmit={async (interactionData: CreateInteractionData) => {
            const result = await createInteraction(interactionData)
            if (result) {
              refetch() // Rafraîchir les données du client
            }
            return result
          }}
        />
      )}
    </MainLayout>
  )
} 