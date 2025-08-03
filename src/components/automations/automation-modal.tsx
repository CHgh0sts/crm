'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreateAutomationData, 
  UpdateAutomationData, 
  Automation,
  AUTOMATION_TYPES,
  SCHEDULE_TYPES,
  RECIPIENT_TYPES
} from '@/hooks/use-automations'
import { useClients } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'
import { 
  Plus, 
  Trash2, 
  Settings, 
  Clock, 
  Users, 
  Play,
  Calendar,
  Mail,
  CheckSquare,
  RotateCcw,
  BarChart3
} from 'lucide-react'

interface AutomationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  automation?: Automation | null
  onSubmit: (data: CreateAutomationData | UpdateAutomationData) => Promise<any>
  loading?: boolean
}

export function AutomationModal({ 
  open, 
  onOpenChange, 
  automation, 
  onSubmit, 
  loading = false 
}: AutomationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{automation ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}</span>
          </DialogTitle>
        </DialogHeader>
        
        {open && (
          <AutomationModalContent
            automation={automation}
            onSubmit={onSubmit}
            loading={loading}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AutomationModalContent({ 
  automation, 
  onSubmit, 
  loading,
  onClose
}: { 
  automation?: Automation | null
  onSubmit: (data: CreateAutomationData | UpdateAutomationData) => Promise<any>
  loading: boolean
  onClose: () => void
}) {
  const { clients } = useClients()
  const { projects } = useProjects()
  
  const [formData, setFormData] = useState<CreateAutomationData | UpdateAutomationData>({
    name: '',
    description: '',
    type: 'EMAIL_REMINDER',
    isActive: true,
    scheduleType: 'DAILY',
    scheduleTime: '09:00',
    config: {},
    recipients: []
  })

  const [recipients, setRecipients] = useState<Array<{
    email: string
    name?: string
    recipientType: 'CUSTOM' | 'CLIENT' | 'TEAM' | 'PROJECT_MEMBERS'
  }>>([])

  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    recipientType: 'CUSTOM' as const
  })

  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name || '',
        description: automation.description || '',
        type: automation.type || 'EMAIL_REMINDER',
        isActive: automation.isActive,
        scheduleType: automation.scheduleType || 'DAILY',
        scheduleTime: automation.scheduleTime || '',
        scheduleDayOfMonth: automation.scheduleDayOfMonth,
        scheduleDayOfWeek: automation.scheduleDayOfWeek,
        scheduleInterval: automation.scheduleInterval,
        customCronExpression: automation.customCronExpression || '',
        config: automation.config || {},
        conditions: automation.conditions,
      })
      setRecipients(automation.recipients || [])
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'EMAIL_REMINDER',
        isActive: true,
        scheduleType: 'DAILY',
        scheduleTime: '09:00',
        config: {},
        recipients: []
      })
      setRecipients([])
    }
  }, [automation, automation?.scheduleTime, automation?.updatedAt])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [field]: value }
    }))
  }

  const addRecipient = () => {
    if (newRecipient.email) {
      setRecipients(prev => [...prev, { ...newRecipient }])
      setNewRecipient({ email: '', name: '', recipientType: 'CUSTOM' })
    }
  }

  const removeRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      return
    }

    // Nettoyer les données avant envoi
    const cleanedData: any = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      type: formData.type,
      isActive: formData.isActive,
      scheduleType: formData.scheduleType,
      config: formData.config || {},
      conditions: formData.conditions || undefined,
      recipients: recipients.length > 0 ? recipients : undefined
    }

    // Ajouter les champs de planification seulement s'ils sont valides
    if (formData.scheduleTime && formData.scheduleTime.trim()) {
      cleanedData.scheduleTime = formData.scheduleTime.trim()
    }

    if (formData.scheduleDayOfMonth !== undefined && formData.scheduleDayOfMonth >= 1 && formData.scheduleDayOfMonth <= 31) {
      cleanedData.scheduleDayOfMonth = formData.scheduleDayOfMonth
    }

    if (formData.scheduleDayOfWeek !== undefined && formData.scheduleDayOfWeek >= 0 && formData.scheduleDayOfWeek <= 6) {
      cleanedData.scheduleDayOfWeek = formData.scheduleDayOfWeek
    }

    if (formData.scheduleInterval !== undefined && formData.scheduleInterval > 0) {
      cleanedData.scheduleInterval = formData.scheduleInterval
    }

    if (formData.customCronExpression && formData.customCronExpression.trim()) {
      cleanedData.customCronExpression = formData.customCronExpression.trim()
    }

    const result = await onSubmit(cleanedData)

    if (result) {
      // Si c'est une mise à jour (automation existe), synchroniser le formulaire avec les nouvelles données
      if (automation && result.scheduleTime !== undefined) {
        setFormData(prev => ({
          ...prev,
          scheduleTime: result.scheduleTime || '',
          scheduleDayOfMonth: result.scheduleDayOfMonth,
          scheduleDayOfWeek: result.scheduleDayOfWeek,
          scheduleInterval: result.scheduleInterval,
          customCronExpression: result.customCronExpression || '',
          config: result.config || {},
          conditions: result.conditions,
        }))
        setRecipients(result.recipients || [])
      }
      onClose()
    }
  }

  const selectedType = AUTOMATION_TYPES.find(type => type.value === formData.type)
  const selectedScheduleType = SCHEDULE_TYPES.find(type => type.value === formData.scheduleType)

  // Fonctions helper pour les recommandations intelligentes
  const getScheduleRecommendations = (automationType: string) => {
    const recommendations: Record<string, string> = {
      'EMAIL_REMINDER': 'Vérifiez quotidiennement le matin (9h-11h) pour détecter les conditions et envoyer les emails automatiquement.',
      'INVOICE_REMINDER': 'Exécutez quotidiennement le matin (9h-10h) pour vérifier les factures arrivées à échéance et envoyer les rappels automatiquement.',
      'BACKUP_DATA': 'Programmez quotidiennement la nuit (2h-3h) pour ne pas impacter les performances.',
      'REPORT_GENERATION': 'Générez mensuellement le 1er du mois (8h) ou hebdomadairement le lundi.',
      'TASK_CREATION': 'Créez des tâches quotidiennement en début de journée (8h-9h).',
      'STATUS_UPDATE': 'Mettez à jour les statuts quotidiennement en fin de journée (18h-19h).',
      'CLIENT_FOLLOW_UP': 'Effectuez le suivi hebdomadairement le mercredi (14h) ou mensuellement.',
      'PROJECT_ARCHIVE': 'Archivez mensuellement le dernier jour du mois (20h).',
      'CLIENT_CHECK_IN': 'Vérifiez bi-hebdomadairement le mardi et vendredi (15h).',
      'DEADLINE_ALERT': 'Alertez quotidiennement le matin (8h) pour les échéances du jour.',
      'NOTIFICATION_SEND': 'Envoyez selon la criticité : hourly pour urgent, daily pour important.'
    }
    return recommendations[automationType] || 'Choisissez la fréquence selon vos besoins métier.'
  }

  const getFilteredScheduleTypes = (automationType: string) => {
    const allTypes = SCHEDULE_TYPES.map(type => ({ ...type, recommended: false }))
    
    // Recommandations selon le type d'automatisation
    const recommendedTypes: Record<string, string[]> = {
      'EMAIL_REMINDER': ['DAILY', 'WEEKLY'],
      'INVOICE_REMINDER': ['DAILY', 'WEEKLY'],
      'BACKUP_DATA': ['DAILY'],
      'REPORT_GENERATION': ['WEEKLY', 'MONTHLY'],
      'TASK_CREATION': ['DAILY', 'HOURLY'],
      'STATUS_UPDATE': ['DAILY', 'HOURLY'],
      'CLIENT_FOLLOW_UP': ['WEEKLY', 'MONTHLY'],
      'PROJECT_ARCHIVE': ['MONTHLY', 'WEEKLY'],
      'CLIENT_CHECK_IN': ['WEEKLY'],
      'DEADLINE_ALERT': ['DAILY', 'HOURLY'],
      'NOTIFICATION_SEND': ['HOURLY', 'DAILY']
    }

    const recommended = recommendedTypes[automationType] || []
    
         return allTypes.map(type => ({
       ...type,
       recommended: recommended.includes(type.value)
     })).sort((a, b) => {
       // Mettre les recommandés en premier
       if (a.recommended && !b.recommended) return -1
       if (!a.recommended && b.recommended) return 1
       return 0
     })
   }

   const getSuggestedTimes = (automationType: string) => {
     const timesSuggestions: Record<string, Array<{value: string, label: string, description: string}>> = {
       'EMAIL_REMINDER': [
         { value: '09:00', label: '09h00', description: 'Début de journée' },
         { value: '10:30', label: '10h30', description: 'Milieu de matinée' },
         { value: '14:00', label: '14h00', description: 'Après déjeuner' }
       ],
       'INVOICE_REMINDER': [
         { value: '09:00', label: '09h00', description: 'Début de matinée' },
         { value: '10:00', label: '10h00', description: 'Milieu de matinée' },
         { value: '14:00', label: '14h00', description: 'Début d\'après-midi' }
       ],
       'BACKUP_DATA': [
         { value: '02:00', label: '02h00', description: 'Nuit calme' },
         { value: '03:00', label: '03h00', description: 'Trafic minimal' },
         { value: '23:00', label: '23h00', description: 'Fin de journée' }
       ],
       'REPORT_GENERATION': [
         { value: '08:00', label: '08h00', description: 'Début de journée' },
         { value: '18:00', label: '18h00', description: 'Fin de journée' },
         { value: '07:00', label: '07h00', description: 'Tôt le matin' }
       ],
       'TASK_CREATION': [
         { value: '08:00', label: '08h00', description: 'Début de journée' },
         { value: '09:00', label: '09h00', description: 'Matinée' },
         { value: '13:00', label: '13h00', description: 'Après déjeuner' }
       ],
       'STATUS_UPDATE': [
         { value: '18:00', label: '18h00', description: 'Fin de journée' },
         { value: '17:00', label: '17h00', description: 'Fin d\'après-midi' },
         { value: '12:00', label: '12h00', description: 'Midi' }
       ],
       'CLIENT_FOLLOW_UP': [
         { value: '14:00', label: '14h00', description: 'Après-midi' },
         { value: '10:00', label: '10h00', description: 'Matinée' },
         { value: '16:00', label: '16h00', description: 'Milieu d\'après-midi' }
       ],
       'PROJECT_ARCHIVE': [
         { value: '20:00', label: '20h00', description: 'Soirée' },
         { value: '19:00', label: '19h00', description: 'Fin de journée' },
         { value: '22:00', label: '22h00', description: 'Tard le soir' }
       ],
       'CLIENT_CHECK_IN': [
         { value: '15:00', label: '15h00', description: 'Milieu d\'après-midi' },
         { value: '11:00', label: '11h00', description: 'Fin de matinée' },
         { value: '16:30', label: '16h30', description: 'Après-midi' }
       ],
       'DEADLINE_ALERT': [
         { value: '08:00', label: '08h00', description: 'Début de journée' },
         { value: '09:30', label: '09h30', description: 'Matinée' },
         { value: '13:30', label: '13h30', description: 'Après déjeuner' }
       ],
       'NOTIFICATION_SEND': [
         { value: '09:00', label: '09h00', description: 'Matinée' },
         { value: '14:00', label: '14h00', description: 'Après-midi' },
         { value: '11:00', label: '11h00', description: 'Milieu de matinée' }
       ]
     }
     
     return timesSuggestions[automationType] || [
       { value: '09:00', label: '09h00', description: 'Matinée' },
       { value: '14:00', label: '14h00', description: 'Après-midi' },
       { value: '18:00', label: '18h00', description: 'Soirée' }
     ]
   }

   const getWeekDaysWithRecommendations = (automationType: string) => {
     const baseDays = [
       { value: '0', label: 'Dimanche', recommended: false },
       { value: '1', label: 'Lundi', recommended: false },
       { value: '2', label: 'Mardi', recommended: false },
       { value: '3', label: 'Mercredi', recommended: false },
       { value: '4', label: 'Jeudi', recommended: false },
       { value: '5', label: 'Vendredi', recommended: false },
       { value: '6', label: 'Samedi', recommended: false }
     ]

     const recommendations: Record<string, string[]> = {
       'EMAIL_REMINDER': ['1', '3'], // Lundi, Mercredi
       'INVOICE_REMINDER': ['1'], // Lundi
       'REPORT_GENERATION': ['1', '5'], // Lundi, Vendredi
       'CLIENT_FOLLOW_UP': ['3', '5'], // Mercredi, Vendredi
       'PROJECT_ARCHIVE': ['5', '0'], // Vendredi, Dimanche
       'CLIENT_CHECK_IN': ['2', '5'], // Mardi, Vendredi
       'DEADLINE_ALERT': ['1', '4'], // Lundi, Jeudi
       'NOTIFICATION_SEND': ['1', '3', '5'] // Lundi, Mercredi, Vendredi
     }

     const recommended = recommendations[automationType] || ['1']
     
     return baseDays.map(day => ({
       ...day,
       recommended: recommended.includes(day.value),
       reason: recommended.includes(day.value) ? getReasonForDay(automationType, day.value) : undefined
     }))
   }

   const getReasonForDay = (automationType: string, dayValue: string) => {
     const reasons: Record<string, Record<string, string>> = {
       'EMAIL_REMINDER': {
         '1': 'Début de semaine, forte attention',
         '3': 'Milieu de semaine, relance efficace'
       },
       'INVOICE_REMINDER': {
         '1': 'Début de semaine professionnel'
       },
       'REPORT_GENERATION': {
         '1': 'Semaine complète de données',
         '5': 'Bilan de fin de semaine'
       },
       'CLIENT_FOLLOW_UP': {
         '3': 'Milieu de semaine optimal',
         '5': 'Bilan avant week-end'
       }
     }
     return reasons[automationType]?.[dayValue] || 'Recommandé pour ce type'
   }

   const getWeekDayAdvice = (automationType: string) => {
     const advice: Record<string, string> = {
       'EMAIL_REMINDER': 'Exécution quotidienne recommandée pour détecter en continu les conditions. Si hebdomadaire, préférez lundi/mercredi.',
       'INVOICE_REMINDER': 'Exécution quotidienne recommandée pour vérifier en continu les échéances. Si hebdomadaire, privilégiez le lundi.',
       'REPORT_GENERATION': 'Générez les rapports en début ou fin de semaine pour une vision complète.',
       'CLIENT_FOLLOW_UP': 'Le milieu et la fin de semaine sont parfaits pour le suivi client.',
       'PROJECT_ARCHIVE': 'Archivez en fin de semaine ou weekend pour ne pas perturber les équipes.',
       'CLIENT_CHECK_IN': 'Mardi et vendredi permettent un suivi régulier sans surcharge.',
       'DEADLINE_ALERT': 'Alertes en début et milieu de semaine pour une meilleure réactivité.',
       'NOTIFICATION_SEND': 'Répartissez sur plusieurs jours pour maintenir l\'engagement.'
     }
     return advice[automationType] || 'Choisissez le jour selon vos préférences organisationnelles.'
   }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="schedule">Planification</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="recipients">Destinataires</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Informations générales</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'automatisation *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Rappel factures impayées"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Description de l'automatisation..."
                  rows={3}
                />
              </div>

              {/* Type d'automatisation */}
              <div className="space-y-2">
                <Label htmlFor="type">Type d'automatisation *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => handleChange('type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {formData.type && selectedType && (
                        <div className="flex items-center space-x-2 truncate">
                          <span>{selectedType.icon}</span>
                          <span className="truncate">{selectedType.label}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-w-[400px]">
                    {AUTOMATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-start space-x-2 w-full">
                          <span className="mt-0.5">{type.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div>{type.label}</div>
                            <div className="text-xs text-muted-foreground break-words whitespace-normal leading-tight">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Statut actif */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Automatisation active
                </Label>
              </div>

              {/* Aperçu du type sélectionné */}
              {selectedType && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: selectedType.color }}
                      >
                        {selectedType.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{selectedType.label}</h4>
                        <p className="text-sm text-muted-foreground">{selectedType.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Planification */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Configuration de la planification</span>
              </CardTitle>
              {selectedType && (
                <CardDescription>
                  Paramètres optimisés pour : <strong>{selectedType.label}</strong>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
                            {/* Suggestions intelligentes selon le type d'automatisation */}
              {selectedType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-blue-600">💡</div>
                      <h4 className="text-sm font-medium text-blue-800">Recommandations :</h4>
                    </div>
                    <div className="text-sm text-blue-700 leading-relaxed">
                      {getScheduleRecommendations(formData.type || '')}
                    </div>
                  </div>
                </div>
              )}

              {/* Type de planification */}
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Type de planification</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value: any) => handleChange('scheduleType', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredScheduleTypes(formData.type || '').map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="w-full">
                          <div className={`text-start ${type.recommended ? "text-blue-600 font-medium" : ""}`}>
                            {type.recommended && "⭐ "}{type.label}
                            {type.recommended && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded ml-2">
                                Recommandé
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Heure avec suggestions intelligentes */}
              {(formData.scheduleType === 'DAILY' || formData.scheduleType === 'WEEKLY' || 
                formData.scheduleType === 'MONTHLY' || formData.scheduleType === 'ONCE') && (
                <div className="space-y-3">
                  <Label htmlFor="scheduleTime">Heure d'exécution</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={formData.scheduleTime || ''}
                    onChange={(e) => handleChange('scheduleTime', e.target.value)}
                    className="w-full"
                  />
                  
                  {/* Suggestions d'heures selon le type d'automatisation */}
                  {selectedType && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Heures suggérées :</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {getSuggestedTimes(formData.type || '').map((time) => (
                          <button
                            key={time.value}
                            type="button"
                            onClick={() => handleChange('scheduleTime', time.value)}
                            className={`text-xs px-2 py-2 rounded border transition-colors text-center ${
                              formData.scheduleTime === time.value
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="font-medium">{time.label}</div>
                            <div className="text-xs opacity-75 truncate">{time.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Jour de la semaine avec recommandations */}
              {formData.scheduleType === 'WEEKLY' && (
                <div className="space-y-3">
                  <Label htmlFor="scheduleDayOfWeek">Jour de la semaine</Label>
                  <Select
                    value={formData.scheduleDayOfWeek?.toString() || ''}
                    onValueChange={(value) => handleChange('scheduleDayOfWeek', value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {getWeekDaysWithRecommendations(formData.type || '').map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          <div className="w-full">
                            <div className={`text-start ${day.recommended ? "font-medium text-blue-600" : ""}`}>
                              {day.recommended && "⭐ "}{day.label}
                              {day.recommended && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded ml-2">
                                  Optimal
                                </span>
                              )}
                            </div>
                            {day.reason && (
                              <div className="text-xs text-muted-foreground">{day.reason}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Explication du choix recommandé */}
                  {selectedType && (
                    <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                      <strong>💡 Conseil :</strong> {getWeekDayAdvice(formData.type || '')}
                    </div>
                  )}
                </div>
              )}

              {/* Jour du mois */}
              {formData.scheduleType === 'MONTHLY' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduleDayOfMonth">Jour du mois (1-31)</Label>
                  <Input
                    id="scheduleDayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.scheduleDayOfMonth || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      handleChange('scheduleDayOfMonth', value)
                    }}
                    placeholder="Ex: 18"
                    className="w-full"
                  />
                </div>
              )}

              {/* Intervalle */}
              {formData.scheduleType === 'INTERVAL' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduleInterval">Intervalle (en minutes)</Label>
                  <Input
                    id="scheduleInterval"
                    type="number"
                    min="1"
                    value={formData.scheduleInterval || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      handleChange('scheduleInterval', value)
                    }}
                    placeholder="Ex: 60 pour chaque heure"
                    className="w-full"
                  />
                </div>
              )}

              {/* Expression Cron */}
              {formData.scheduleType === 'CUSTOM_CRON' && (
                <div className="space-y-2">
                  <Label htmlFor="customCronExpression">Expression Cron</Label>
                  <Input
                    id="customCronExpression"
                    value={formData.customCronExpression || ''}
                    onChange={(e) => handleChange('customCronExpression', e.target.value)}
                    placeholder="Ex: 0 10 * * 1-5"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute heure jour mois jour-semaine
                  </p>
                </div>
              )}

              {/* Aperçu de la planification */}
              {selectedScheduleType && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Planification:</span>
                      <Badge variant="outline">{selectedScheduleType.label}</Badge>
                      {formData.scheduleTime && <span>à {formData.scheduleTime}</span>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Configuration */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configuration spécifique</span>
              </CardTitle>
              <CardDescription>
                Paramètres spécifiques pour le type d'automatisation sélectionné
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutomationConfigForm
                type={formData.type || 'EMAIL_REMINDER'}
                config={formData.config || {}}
                onConfigChange={handleConfigChange}
                clients={clients}
                projects={projects}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Destinataires */}
        <TabsContent value="recipients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Destinataires</span>
              </CardTitle>
              <CardDescription>
                Gérer la liste des destinataires pour cette automatisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ajouter un destinataire */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Ajouter un destinataire</Label>
                </div>
                
                {/* Formulaire d'ajout avec disposition sur plusieurs niveaux */}
                <div className="space-y-4">
                  {/* Première ligne : Email et Nom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="recipient-email" className="text-xs text-muted-foreground">Email *</Label>
                      <Input
                        id="recipient-email"
                        placeholder="nom@exemple.com"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="recipient-name" className="text-xs text-muted-foreground">Nom (optionnel)</Label>
                      <Input
                        id="recipient-name"
                        placeholder="Nom complet"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Deuxième ligne : Type - pleine largeur */}
                  <div className="space-y-1">
                    <Label htmlFor="recipient-type" className="text-xs text-muted-foreground">Type</Label>
                    <Select
                      value={newRecipient.recipientType}
                      onValueChange={(value: any) => setNewRecipient(prev => ({ ...prev, recipientType: value }))}
                    >
                      <SelectTrigger id="recipient-type" className="w-full">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPIENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Troisième ligne : Bouton centré */}
                  <div className="flex justify-center">
                    <Button 
                      type="button" 
                      onClick={addRecipient} 
                      className="px-8 bg-blue-600 hover:bg-blue-700"
                      disabled={!newRecipient.email.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Séparateur visuel */}
              {recipients.length > 0 && (
                <div className="border-t border-gray-200 my-6"></div>
              )}

              {/* Liste des destinataires */}
              {recipients.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-medium">
                      Destinataires configurés ({recipients.length})
                    </Label>
                  </div>
                  
                  <div className="space-y-3">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">{recipient.email}</div>
                            {recipient.name && (
                              <div className="text-sm text-gray-500 truncate">{recipient.name}</div>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                            {RECIPIENT_TYPES.find(t => t.value === recipient.recipientType)?.label}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(index)}
                          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* État vide amélioré */}
              {recipients.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun destinataire configuré</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Les emails d'automatisation seront envoyés aux destinataires que vous ajoutez ici.
                  </p>
                  <p className="text-xs text-gray-400">
                    💡 Astuce : Vous pouvez ajouter plusieurs destinataires pour la même automatisation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name?.trim()}
        >
          {loading ? 'Enregistrement...' : (automation ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  )
}

// Composant de configuration spécifique selon le type d'automatisation
function AutomationConfigForm({ 
  type, 
  config, 
  onConfigChange, 
  clients, 
  projects 
}: {
  type: string
  config: Record<string, any>
  onConfigChange: (field: string, value: any) => void
  clients: any[]
  projects: any[]
}) {
  switch (type) {
    case 'EMAIL_REMINDER':
      return (
        <div className="space-y-6">
          {/* Section 1: Conditions de déclenchement */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>🎯</span>
              <span>Conditions de déclenchement</span>
            </h4>
            
            <div className="space-y-2">
              <Label>Envoyer un email SI :</Label>
              <Select
                value={config.triggerCondition || ''}
                onValueChange={(value) => onConfigChange('triggerCondition', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une condition..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response">Pas de réponse au précédent email</SelectItem>
                  <SelectItem value="subscription_expiry">Échéance d'abonnement approche</SelectItem>
                  <SelectItem value="project_deadline">Échéance de projet approche</SelectItem>
                  <SelectItem value="no_activity">Pas d'activité client depuis X jours</SelectItem>
                  <SelectItem value="follow_up_due">Relance programmée due</SelectItem>
                  <SelectItem value="custom_date">Date personnalisée atteinte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configuration selon la condition */}
            {config.triggerCondition === 'no_response' && (
              <div className="space-y-3 bg-white p-3 rounded border">
                <Label className="text-sm font-medium">Configuration "Pas de réponse"</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type d'email précédent</Label>
                    <Select
                      value={config.previousEmailType || ''}
                      onValueChange={(value) => onConfigChange('previousEmailType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospection">Email de prospection</SelectItem>
                        <SelectItem value="devis">Envoi de devis</SelectItem>
                        <SelectItem value="relance">Email de relance</SelectItem>
                        <SelectItem value="suivi">Email de suivi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Délai sans réponse</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={config.noResponseDays || ''}
                        onChange={(e) => onConfigChange('noResponseDays', parseInt(e.target.value))}
                        placeholder="3"
                        className="w-20"
                      />
                      <span className="text-sm self-center">jours</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {config.triggerCondition === 'subscription_expiry' && (
              <div className="space-y-3 bg-white p-3 rounded border">
                <Label className="text-sm font-medium">Configuration "Échéance abonnement"</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Alerter avant échéance</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={config.daysBeforeExpiry || ''}
                        onChange={(e) => onConfigChange('daysBeforeExpiry', parseInt(e.target.value))}
                        placeholder="30"
                        className="w-20"
                      />
                      <span className="text-sm self-center">jours avant</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Type d'abonnement</Label>
                    <Select
                      value={config.subscriptionType || 'all'}
                      onValueChange={(value) => onConfigChange('subscriptionType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les abonnements</SelectItem>
                        <SelectItem value="premium">Premium uniquement</SelectItem>
                        <SelectItem value="basic">Basic uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {config.triggerCondition === 'custom_date' && (
              <div className="space-y-3 bg-white p-3 rounded border">
                <Label className="text-sm font-medium">Configuration "Date personnalisée"</Label>
                <div className="space-y-2">
                  <Label className="text-xs">Date de référence</Label>
                  <Select
                    value={config.dateReference || ''}
                    onValueChange={(value) => onConfigChange('dateReference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une date de référence..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_email">Date du dernier email envoyé</SelectItem>
                      <SelectItem value="project_start">Date de début de projet</SelectItem>
                      <SelectItem value="client_creation">Date de création client</SelectItem>
                      <SelectItem value="fixed_date">Date fixe (à saisir)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {config.dateReference === 'fixed_date' && (
                    <Input
                      type="date"
                      value={config.fixedDate || ''}
                      onChange={(e) => onConfigChange('fixedDate', e.target.value)}
                      className="w-full"
                    />
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={config.dateOffset || 'after'}
                      onValueChange={(value) => onConfigChange('dateOffset', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="after">Après</SelectItem>
                        <SelectItem value="before">Avant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      value={config.offsetDays || ''}
                      onChange={(e) => onConfigChange('offsetDays', parseInt(e.target.value))}
                      placeholder="0"
                      className="w-20"
                    />
                    <span className="text-sm">jours</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Contenu de l'email */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>📧</span>
              <span>Contenu de l'email</span>
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Sujet de l'email</Label>
              <Input
                id="emailSubject"
                value={config.subject || ''}
                onChange={(e) => onConfigChange('subject', e.target.value)}
                placeholder="Ex: Relance importante - [NOM_CLIENT]"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailMessage">Message</Label>
              <Textarea
                id="emailMessage"
                value={config.message || ''}
                onChange={(e) => onConfigChange('message', e.target.value)}
                placeholder="Bonjour [NOM_CLIENT],&#10;&#10;J'espère que vous allez bien...&#10;&#10;Cordialement"
                rows={6}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                💡 Variables disponibles : [NOM_CLIENT], [EMAIL_CLIENT], [PROJET], [DATE], etc.
              </p>
            </div>
          </div>

          {/* Section 3: Filtres et limitations */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>🔍</span>
              <span>Filtres et limitations</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clients concernés</Label>
                <Select
                  value={config.clientFilter || 'all'}
                  onValueChange={(value) => onConfigChange('clientFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="active">Clients actifs uniquement</SelectItem>
                    <SelectItem value="prospects">Prospects uniquement</SelectItem>
                    <SelectItem value="specific">Client spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Limite d'envois</Label>
                <Select
                  value={config.sendLimit?.toString() || '1'}
                  onValueChange={(value) => onConfigChange('sendLimit', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 seul envoi</SelectItem>
                    <SelectItem value="2">Maximum 2 envois</SelectItem>
                    <SelectItem value="3">Maximum 3 envois</SelectItem>
                    <SelectItem value="999">Illimité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )

    case 'TASK_CREATION':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tâches à créer</Label>
            <div className="space-y-2">
              <Input
                placeholder="Titre de la tâche"
                value={config.taskTitle || ''}
                onChange={(e) => onConfigChange('taskTitle', e.target.value)}
              />
              <Textarea
                placeholder="Description de la tâche"
                value={config.taskDescription || ''}
                onChange={(e) => onConfigChange('taskDescription', e.target.value)}
                rows={3}
              />
              <Select
                value={config.taskPriority || 'MEDIUM'}
                onValueChange={(value) => onConfigChange('taskPriority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )

    case 'INVOICE_REMINDER':
      return (
        <div className="space-y-6">
          {/* Section 1: Logique de détection des factures */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>💰</span>
              <span>Détection des factures impayées</span>
            </h4>
            
            <div className="bg-white p-3 rounded border space-y-3">
              <div className="text-sm text-gray-700">
                <strong>Logique :</strong> Cette automatisation va scanner toutes les factures et identifier celles qui sont :
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Statut :</strong> Non payées (status != "PAID")</li>
                <li>• <strong>Échéance :</strong> Date d'échéance dépassée depuis plus de X jours</li>
                <li>• <strong>Filtres :</strong> Selon vos critères ci-dessous</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Délai de grâce après échéance</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 7, 15, 30].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onConfigChange('reminderDays', days)}
                    className={`px-3 py-2 text-sm rounded border transition-colors ${
                      config.reminderDays === days
                        ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {days} jours
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Ou personnalisé :</span>
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={config.reminderDays || ''}
                  onChange={(e) => onConfigChange('reminderDays', parseInt(e.target.value) || '')}
                  placeholder="Ex: 10"
                  className="w-20"
                />
                <span className="text-sm">jours après échéance</span>
              </div>
              <p className="text-xs text-red-600">
                Exemple : Si délai = 7 jours, une facture échue le 1er janvier sera rappelée à partir du 8 janvier
              </p>
            </div>
          </div>

          {/* Section 2: Filtres de sélection */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>🔍</span>
              <span>Critères de sélection des factures</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant minimum</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.minAmount || ''}
                    onChange={(e) => onConfigChange('minAmount', parseFloat(e.target.value) || '')}
                    placeholder="Ex: 50"
                    className="w-full"
                  />
                  <span className="text-sm">€</span>
                </div>
                <p className="text-xs text-muted-foreground">Ignorer les factures inférieures à ce montant</p>
              </div>
              
              <div className="space-y-2">
                <Label>Montant maximum</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.maxAmount || ''}
                    onChange={(e) => onConfigChange('maxAmount', parseFloat(e.target.value) || '')}
                    placeholder="Ex: 5000"
                    className="w-full"
                  />
                  <span className="text-sm">€</span>
                </div>
                <p className="text-xs text-muted-foreground">Pour les gros montants, gérer manuellement</p>
              </div>
              
              <div className="space-y-2">
                <Label>Clients concernés</Label>
                <Select
                  value={config.clientFilter || 'all'}
                  onValueChange={(value) => onConfigChange('clientFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="specific">Client spécifique</SelectItem>
                    <SelectItem value="exclude_vip">Exclure les clients VIP</SelectItem>
                    <SelectItem value="new_clients">Nouveaux clients uniquement</SelectItem>
                  </SelectContent>
                </Select>
                
                {config.clientFilter === 'specific' && (
                  <Select
                    value={config.specificClientId || ''}
                    onValueChange={(value) => onConfigChange('specificClientId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Limite de rappels par facture</Label>
                <Select
                  value={config.maxReminders?.toString() || '3'}
                  onValueChange={(value) => onConfigChange('maxReminders', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 seul rappel</SelectItem>
                    <SelectItem value="2">2 rappels maximum</SelectItem>
                    <SelectItem value="3">3 rappels maximum</SelectItem>
                    <SelectItem value="5">5 rappels maximum</SelectItem>
                    <SelectItem value="999">Illimité</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Éviter le spam pour une même facture</p>
              </div>
            </div>
          </div>

          {/* Section 3: Configuration de l'email de rappel */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>📧</span>
              <span>Email de rappel automatique</span>
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invoiceSubject">Sujet de l'email</Label>
                <Input
                  id="invoiceSubject"
                  value={config.subject || 'Rappel de facture impayée - [NUMERO_FACTURE]'}
                  onChange={(e) => onConfigChange('subject', e.target.value)}
                  placeholder="Rappel de facture impayée - [NUMERO_FACTURE]"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceMessage">Message du rappel</Label>
                <Textarea
                  id="invoiceMessage"
                  value={config.message || 'Madame, Monsieur [NOM_CLIENT],\n\nNous vous rappelons qu\'une facture ([NUMERO_FACTURE]) d\'un montant de [MONTANT_FACTURE]€ émise le [DATE_EMISSION] était due le [DATE_ECHEANCE] et reste impayée à ce jour.\n\nNous vous remercions de bien vouloir régulariser cette situation dans les meilleurs délais.\n\nCordialement,\nL\'équipe comptabilité'}
                  onChange={(e) => onConfigChange('message', e.target.value)}
                  placeholder="Votre message de rappel..."
                  rows={8}
                  className="w-full"
                />
                <div className="text-xs text-blue-600 space-y-1">
                  <p><strong>Variables disponibles :</strong></p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>• [NOM_CLIENT] - Nom du client</span>
                    <span>• [NUMERO_FACTURE] - N° de facture</span>
                    <span>• [MONTANT_FACTURE] - Montant HT</span>
                    <span>• [DATE_EMISSION] - Date d\'émission</span>
                    <span>• [DATE_ECHEANCE] - Date d\'échéance</span>
                    <span>• [JOURS_RETARD] - Jours de retard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Récurrence et escalade */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <span>🔄</span>
              <span>Récurrence et escalade</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fréquence de relance</Label>
                <Select
                  value={config.reminderFrequency || 'single'}
                  onValueChange={(value) => onConfigChange('reminderFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Relance unique</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="biweekly">Toutes les 2 semaines</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Escalade après X rappels</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.escalationAfter || ''}
                    onChange={(e) => onConfigChange('escalationAfter', parseInt(e.target.value) || '')}
                    placeholder="3"
                    className="w-20"
                  />
                  <span className="text-sm">rappels → notifier manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'REPORT_GENERATION':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Types de rapports à générer</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="projects_summary"
                  checked={config.reportTypes?.includes('projects_summary') || false}
                  onChange={(e) => {
                    const currentTypes = config.reportTypes || []
                    const newTypes = e.target.checked 
                      ? [...currentTypes, 'projects_summary']
                      : currentTypes.filter((t: string) => t !== 'projects_summary')
                    onConfigChange('reportTypes', newTypes)
                  }}
                  aria-label="Résumé des projets"
                />
                <Label htmlFor="projects_summary">Résumé des projets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clients_summary"
                  checked={config.reportTypes?.includes('clients_summary') || false}
                  onChange={(e) => {
                    const currentTypes = config.reportTypes || []
                    const newTypes = e.target.checked 
                      ? [...currentTypes, 'clients_summary']
                      : currentTypes.filter((t: string) => t !== 'clients_summary')
                    onConfigChange('reportTypes', newTypes)
                  }}
                  aria-label="Résumé des clients"
                />
                <Label htmlFor="clients_summary">Résumé des clients</Label>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Configuration automatique</p>
          <p className="text-sm">Aucune configuration spécifique requise pour ce type</p>
        </div>
      )
  }
} 