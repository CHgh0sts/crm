'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useSettings } from '@/hooks/use-settings'
import { useAuth } from '@/components/providers/auth-provider'
import { TemplateSelector } from '@/components/settings/template-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Settings,
  Building2,
  Bell,
  Shield,
  Download,
  Upload,
  Palette,
  Globe,
  CreditCard,
  Lock,
  Trash2,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

const currencies = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
]

const timezones = [
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10)' },
]

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    settings, 
    loading, 
    updateSettings, 
    updateNotifications,
    changePassword,
    exportData,
    deleteAccount,
    logoutAllSessions 
  } = useSettings()
  
  const { user, refreshUser } = useAuth()

  // États locaux pour les formulaires
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    avatar: '',
  })

  const [preferences, setPreferences] = useState({
    currency: 'EUR',
    timezone: 'Europe/Paris',
    language: 'fr',
    theme: 'light',
  })

  const [businessSettings, setBusinessSettings] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    siret: '',
    tvaNumber: '',
    defaultHourlyRate: '',
    invoicePrefix: 'FACT',
    quotePrefix: 'DEVIS',
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    invoiceReminders: true,
    projectUpdates: true,
    clientMessages: true,
  })

  // Synchroniser les données quand les settings sont chargés
  useEffect(() => {
    if (settings) {
      setProfileData({
        firstName: settings.firstName || '',
        lastName: settings.lastName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        company: settings.company || '',
        address: settings.address || '',
        city: settings.city || '',
        postalCode: settings.postalCode || '',
        country: settings.country || '',
        avatar: settings.avatar || '',
      })

      setPreferences({
        currency: settings.currency || 'EUR',
        timezone: settings.timezone || 'Europe/Paris',
        language: settings.language || 'fr',
        theme: settings.theme || 'light',
      })

      if (settings.notifications) {
        setNotifications(settings.notifications)
      }
    }
  }, [settings])

  // Fonction pour gérer l'upload d'avatar
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide (JPG, PNG, GIF)')
      return
    }

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse. Taille maximum : 2MB')
      return
    }

    setUploadingAvatar(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string
        
        // Mettre à jour l'avatar via l'API
        await updateSettings({ avatar: base64 })
        
        // Mettre à jour le state local
        setProfileData(prev => ({ ...prev, avatar: base64 }))
        
        toast.success('Avatar mis à jour avec succès')
        refreshUser() // Rafraîchir les données de l'utilisateur après la mise à jour de l'avatar
      } catch (error) {
        toast.error('Erreur lors de la mise à jour de l\'avatar')
      } finally {
        setUploadingAvatar(false)
      }
    }
    
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier')
      setUploadingAvatar(false)
    }
    
    reader.readAsDataURL(file)
  }

  // Fonction pour déclencher la sélection de fichier
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Fonction pour supprimer l'avatar
  const removeAvatar = async () => {
    try {
      setUploadingAvatar(true)
      await updateSettings({ avatar: '' })
      setProfileData(prev => ({ ...prev, avatar: '' }))
      toast.success('Avatar supprimé avec succès')
      refreshUser() // Rafraîchir les données de l'utilisateur après la suppression de l'avatar
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateSettings(profileData)
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      await updateSettings(preferences)
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBusiness = async () => {
    setSaving(true)
    try {
      // TODO: Implémenter l'API pour les paramètres d'entreprise
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
      toast.success('Paramètres d\'entreprise mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des paramètres d\'entreprise')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await updateNotifications(notifications)
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des paramètres...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">
              Gérez vos préférences et paramètres de compte
            </p>
          </div>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Données
            </TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles et votre avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-lg">
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={triggerFileSelect}
                        disabled={uploadingAvatar}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {uploadingAvatar ? 'Sauvegarde...' : 'Changer l\'avatar'}
                      </Button>
                      {profileData.avatar && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={removeAvatar}
                          disabled={uploadingAvatar}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG ou GIF. Max 2MB.
                    </p>
                    {/* Input file caché */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Sélectionner une image d'avatar"
                    />
                  </div>
                </div>

                <Separator />

                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-10"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                </div>

                <Separator />

                {/* Adresse */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <h3 className="font-semibold">Adresse</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Rue Example"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        value={profileData.postalCode}
                        onChange={(e) => setProfileData(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="75001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Paris"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="France"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>Sauvegarde...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Préférences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Devise */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Devise
                  </CardTitle>
                  <CardDescription>
                    Choisissez votre devise par défaut pour les factures et devis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise par défaut</Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{currency.symbol}</span>
                              <span>{currency.name} ({currency.code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Cette devise sera utilisée par défaut pour tous vos nouveaux projets, factures et devis.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Fuseau horaire */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localisation
                  </CardTitle>
                  <CardDescription>
                    Paramètres de fuseau horaire et de langue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Thème */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Apparence
                  </CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Thème</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Clair', desc: 'Interface claire' },
                        { value: 'dark', label: 'Sombre', desc: 'Interface sombre' },
                        { value: 'system', label: 'Système', desc: 'Suit les préférences système' }
                      ].map((theme) => (
                        <div
                          key={theme.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            preferences.theme === theme.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value }))}
                        >
                          <div className="font-medium">{theme.label}</div>
                          <div className="text-sm text-muted-foreground">{theme.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving ? (
                  <>Sauvegarde...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Onglet Entreprise */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations d'entreprise
                </CardTitle>
                <CardDescription>
                  Paramètres pour vos factures et documents commerciaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input
                      id="companyName"
                      value={businessSettings.companyName}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Mon Entreprise SARL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      value={businessSettings.siret}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, siret: e.target.value }))}
                      placeholder="12345678901234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tvaNumber">N° TVA Intracommunautaire</Label>
                    <Input
                      id="tvaNumber"
                      value={businessSettings.tvaNumber}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, tvaNumber: e.target.value }))}
                      placeholder="FR12345678901"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultHourlyRate">Taux horaire par défaut</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="defaultHourlyRate"
                        type="number"
                        className="pl-10"
                        value={businessSettings.defaultHourlyRate}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, defaultHourlyRate: e.target.value }))}
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Coordonnées entreprise</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email entreprise</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={businessSettings.companyEmail}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                        placeholder="contact@monentreprise.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Téléphone entreprise</Label>
                      <Input
                        id="companyPhone"
                        value={businessSettings.companyPhone}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyAddress">Adresse entreprise</Label>
                      <Textarea
                        id="companyAddress"
                        value={businessSettings.companyAddress}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                        placeholder="123 Rue de l'Entreprise&#10;75001 Paris&#10;France"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Préfixes de numérotation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">Préfixe des factures</Label>
                      <Input
                        id="invoicePrefix"
                        value={businessSettings.invoicePrefix}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                        placeholder="FACT"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ex: FACT-2024-001
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotePrefix">Préfixe des devis</Label>
                      <Input
                        id="quotePrefix"
                        value={businessSettings.quotePrefix}
                        onChange={(e) => setBusinessSettings(prev => ({ ...prev, quotePrefix: e.target.value }))}
                        placeholder="DEVIS"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ex: DEVIS-2024-001
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveBusiness} disabled={saving}>
                    {saving ? (
                      <>Sauvegarde...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Templates */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Templates de facture
                </CardTitle>
                <CardDescription>
                  Choisissez le template par défaut pour vos nouvelles factures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector
                  selectedTemplateId={settings?.defaultInvoiceTemplate || undefined}
                  onSave={async (templateId) => {
                    const success = await updateSettings({ defaultInvoiceTemplate: templateId })
                    if (success) {
                      toast.success('Template par défaut mis à jour')
                    } else {
                      toast.error('Erreur lors de la mise à jour')
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notifications
                </CardTitle>
                <CardDescription>
                  Gérez les notifications que vous souhaitez recevoir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      title: 'Notifications par email',
                      description: 'Recevoir des notifications importantes par email'
                    },
                    {
                      key: 'pushNotifications',
                      title: 'Notifications push',
                      description: 'Recevoir des notifications dans le navigateur'
                    },
                    {
                      key: 'taskReminders',
                      title: 'Rappels de tâches',
                      description: 'Être notifié des échéances de tâches'
                    },
                    {
                      key: 'invoiceReminders',
                      title: 'Rappels de facturation',
                      description: 'Notifications pour les factures en retard'
                    },
                    {
                      key: 'projectUpdates',
                      title: 'Mises à jour de projets',
                      description: 'Notifications lors des changements sur vos projets'
                    },
                    {
                      key: 'clientMessages',
                      title: 'Messages clients',
                      description: 'Notifications pour les nouveaux messages clients'
                    }
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">{notification.title}</Label>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        checked={notifications[notification.key as keyof typeof notifications]}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, [notification.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? (
                      <>Sauvegarde...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Mot de passe actuel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                  <Button className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sécurité du compte
                  </CardTitle>
                  <CardDescription>
                    Informations et actions de sécurité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Vérification email</p>
                        <p className="text-sm text-muted-foreground">Email vérifié</p>
                      </div>
                      <Badge variant="secondary">Vérifié</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dernière connexion</p>
                        <p className="text-sm text-muted-foreground">Il y a 2 heures</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger mes données
                    </Button>
                    <Button variant="outline" className="w-full">
                      Déconnecter toutes les sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Données */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exporter mes données
                  </CardTitle>
                  <CardDescription>
                    Téléchargez une copie de toutes vos données
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez demander une exportation complète de vos données. 
                      Cela inclut vos projets, clients, factures, et toutes les autres informations.
                    </p>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Demander l'exportation
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importer des données
                  </CardTitle>
                  <CardDescription>
                    Importez des données depuis un autre CRM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Importez vos données depuis un fichier CSV ou JSON. 
                      Formats supportés : clients, projets, factures.
                    </p>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir un fichier
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Zone de danger
                  </CardTitle>
                  <CardDescription>
                    Actions irréversibles sur votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border border-destructive rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-destructive">Supprimer mon compte</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Une fois supprimé, votre compte et toutes vos données seront définitivement perdues. 
                        Cette action est irréversible.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
} 