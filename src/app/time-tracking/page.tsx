'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  useTimeLogs, 
  formatDuration, 
  formatHours,
  CreateTimeLogData,
  UpdateTimeLogData
} from '@/hooks/use-time-tracking'
import { useProjects } from '@/hooks/use-projects'
import { useTasks } from '@/hooks/use-tasks'
import { 
  Play, 
  Pause, 
  Clock, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  Filter,
  Search,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

const statusConfig = {
  TODO: { label: 'À faire', color: 'bg-gray-500' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-500' },
  IN_REVIEW: { label: 'En révision', color: 'bg-yellow-500' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-500' },
}

const priorityConfig = {
  LOW: { label: 'Faible', color: 'bg-gray-500' },
  MEDIUM: { label: 'Moyen', color: 'bg-blue-500' },
  HIGH: { label: 'Élevé', color: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'bg-red-500' },
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

function formatDate(date: string | Date) {
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch {
    return new Date(date).toLocaleDateString('fr-FR')
  }
}

function formatDateTime(date: string | Date) {
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch {
    return new Date(date).toLocaleString('fr-FR')
  }
}

// Composant Timer
function CurrentTimer() {
  const { runningTimer, stopTimer } = useTimeLogs()
  const [currentDuration, setCurrentDuration] = useState(0)

  useEffect(() => {
    if (!runningTimer) {
      setCurrentDuration(0)
      return
    }

    // Calculer la durée actuelle
    const updateDuration = () => {
      const start = new Date(runningTimer.startTime)
      const now = new Date()
      const durationMs = now.getTime() - start.getTime()
      const durationMinutes = Math.floor(durationMs / 60000)
      setCurrentDuration(durationMinutes)
    }

    updateDuration()
    const interval = setInterval(updateDuration, 1000)

    return () => clearInterval(interval)
  }, [runningTimer])

  const handleStopTimer = async () => {
    try {
      await stopTimer()
      // Le message de succès est géré par le hook
    } catch (error) {
      toast.error('Erreur lors de l\'arrêt du timer')
    }
  }

  if (!runningTimer) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Timer actuel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-gray-500">Aucun timer en cours</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/8 via-transparent to-transparent dark:from-blue-400/12 dark:via-transparent dark:to-transparent" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
          <Play className="h-5 w-5" />
          <span>Timer en cours</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div>
          <h3 className="font-medium text-blue-900 dark:text-blue-100">{runningTimer.description}</h3>
          {runningTimer.project && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Projet: {runningTimer.project.name}
            </p>
          )}
          {runningTimer.task && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Tâche: {runningTimer.task.title}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatDuration(currentDuration)}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Démarré à {format(new Date(runningTimer.startTime), 'HH:mm', { locale: fr })}
            </p>
          </div>
          
          <Button 
            onClick={handleStopTimer}
            className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 shadow-lg hover:shadow-red-500/40 hover:shadow-xl transition-all duration-300"
          >
            <Pause className="h-4 w-4 mr-2" />
            Arrêter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour créer/modifier un log
function TimeLogModal({ 
  timeLog, 
  open, 
  onOpenChange, 
  onSuccess 
}: {
  timeLog?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (action?: 'timer_started' | 'log_saved') => void
}) {
  const { createTimeLog, updateTimeLog, startTimer } = useTimeLogs()
  const { projects } = useProjects()
  const { tasks } = useTasks()
  
  const [formData, setFormData] = useState<CreateTimeLogData>({
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: '',
    projectId: '',
    taskId: '',
    isRunning: false,
    isBillable: true,
    hourlyRate: 50,
  })

  useEffect(() => {
    if (timeLog) {
      setFormData({
        description: timeLog.description || '',
        startTime: new Date(timeLog.startTime).toISOString().slice(0, 16),
        endTime: timeLog.endTime ? new Date(timeLog.endTime).toISOString().slice(0, 16) : '',
        projectId: timeLog.project?.id || '',
        taskId: timeLog.task?.id || '',
        isRunning: timeLog.isRunning || false,
        isBillable: timeLog.isBillable || true,
        hourlyRate: timeLog.hourlyRate || 50,
      })
    } else {
      setFormData({
        description: '',
        startTime: new Date().toISOString().slice(0, 16),
        endTime: '',
        projectId: '',
        taskId: '',
        isRunning: false,
        isBillable: true,
        hourlyRate: 50,
      })
    }
  }, [timeLog, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (formData.isRunning) {
        // Démarrer un nouveau timer
        await startTimer(
          formData.description,
          formData.projectId === 'none' ? undefined : formData.projectId || undefined,
          formData.taskId === 'none' ? undefined : formData.taskId || undefined,
          formData.hourlyRate
        )
      } else {
        // Sanitize form data to convert "none" values to undefined
        const sanitizedFormData = {
          ...formData,
          projectId: formData.projectId === 'none' ? undefined : formData.projectId,
          taskId: formData.taskId === 'none' ? undefined : formData.taskId
        }
        
        if (timeLog) {
          // Modifier un log existant
          await updateTimeLog(timeLog.id, sanitizedFormData)
        } else {
          // Créer un nouveau log
          await createTimeLog(sanitizedFormData)
        }
      }
      
      onSuccess(formData.isRunning ? 'timer_started' : 'log_saved')
      onOpenChange(false)
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const filteredTasks = tasks.filter(task => 
    !formData.projectId || formData.projectId === 'none' || task.project?.id === formData.projectId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {timeLog ? 'Modifier le log' : 'Nouveau log de temps'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du travail effectué..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Projet</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  projectId: value,
                  taskId: '' // Reset task when project changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun projet</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="taskId">Tâche</Label>
              <Select
                value={formData.taskId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, taskId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune tâche</SelectItem>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isRunning"
              checked={formData.isRunning}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRunning: checked }))}
            />
            <Label htmlFor="isRunning">Démarrer le timer maintenant</Label>
          </div>

          {!formData.isRunning && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Début *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">Fin</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isBillable"
                checked={formData.isBillable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBillable: checked }))}
              />
              <Label htmlFor="isBillable">Facturable</Label>
            </div>

            {formData.isBillable && (
              <div>
                <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              {formData.isRunning ? 'Démarrer' : (timeLog ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Composant principal
export default function TimeTrackingPage() {
  const { 
    timeLogs, 
    loading, 
    stats, 
    fetchTimeLogs, 
    deleteTimeLog, 
    runningTimer 
  } = useTimeLogs()
  const { projects } = useProjects()
  const { tasks } = useTasks()
  
  const [filters, setFilters] = useState({
    projectId: 'all',
    taskId: '',
    isBillable: 'all',
    startDate: '',
    endDate: '',
  })
  const [timeLogModalOpen, setTimeLogModalOpen] = useState(false)
  const [selectedTimeLog, setSelectedTimeLog] = useState<any>(null)

  const handleDeleteTimeLog = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce log de temps ?')) {
      try {
        await deleteTimeLog(id)
        toast.success('Log supprimé avec succès')
      } catch (error) {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleEditTimeLog = (timeLog: any) => {
    setSelectedTimeLog(timeLog)
    setTimeLogModalOpen(true)
  }

  const handleNewTimeLog = () => {
    setSelectedTimeLog(null)
    setTimeLogModalOpen(true)
  }

  const applyFilters = async () => {
    const apiFilters = {
      ...filters,
      projectId: filters.projectId === 'all' ? undefined : filters.projectId,
      isBillable: filters.isBillable === 'all' ? undefined : filters.isBillable === 'true',
    }
    await fetchTimeLogs(apiFilters)
  }

  const clearFilters = () => {
    setFilters({
      projectId: 'all',
      taskId: '',
      isBillable: 'all',
      startDate: '',
      endDate: '',
    })
    fetchTimeLogs()
  }

  if (loading && !timeLogs.length) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suivi du temps</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez vos heures de travail et suivez votre productivité
            </p>
          </div>
          
          <Button onClick={handleNewTimeLog} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau log
          </Button>
        </div>

        {/* Timer actuel */}
        <CurrentTimer />

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Temps total</CardTitle>
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatHours(stats.totalDuration)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatDuration(stats.totalDuration)}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Temps facturable</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-green-600">{formatHours(stats.billableDuration)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round((stats.billableDuration / stats.totalDuration) * 100) || 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus générés</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Temps facturable uniquement
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Timers actifs</CardTitle>
              <Play className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-orange-600">{stats.runningLogs}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                En cours d'exécution
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Filter className="h-5 w-5" />
              <span>Filtres</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Projet</Label>
                <Select
                  value={filters.projectId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Facturable</Label>
                <Select
                  value={filters.isBillable}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, isBillable: value }))}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Facturable</SelectItem>
                    <SelectItem value="false">Non facturable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600"
                />
              </div>

              <div>
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600"
                />
              </div>

              <div className="flex items-end space-x-2">
                <Button onClick={applyFilters} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Effacer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des logs */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-gray-900 dark:text-white">Logs de temps</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {timeLogs.length} log(s) trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {timeLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun log de temps trouvé</p>
                <Button onClick={handleNewTimeLog} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Créer le premier log
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {timeLogs.map((timeLog) => (
                  <div 
                    key={timeLog.id} 
                    className="border rounded-lg p-4 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors border-blue-200/30 dark:border-slate-600/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">{timeLog.description}</h3>
                          {timeLog.isRunning && (
                            <Badge className="bg-green-500 text-white">
                              En cours
                            </Badge>
                          )}
                          {timeLog.isBillable && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Facturable
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {formatDateTime(timeLog.startTime)}
                            {timeLog.endTime && ` - ${format(new Date(timeLog.endTime), 'HH:mm', { locale: fr })}`}
                          </span>
                          <span className="font-medium">
                            {formatDuration(timeLog.duration || 0)}
                          </span>
                          {timeLog.isBillable && timeLog.hourlyRate && (
                            <span>
                              {formatCurrency((timeLog.duration || 0) / 60 * timeLog.hourlyRate)}
                            </span>
                          )}
                        </div>

                        {(timeLog.project || timeLog.task) && (
                          <div className="flex items-center space-x-4 text-sm">
                            {timeLog.project && (
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: timeLog.project.color }}
                                />
                                <span className="text-blue-600 dark:text-blue-400">{timeLog.project.name}</span>
                                {timeLog.project.client && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ({timeLog.project.client.name})
                                  </span>
                                )}
                              </div>
                            )}
                            {timeLog.task && (
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className={`${statusConfig[timeLog.task.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white text-xs`}
                                >
                                  {timeLog.task.title}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTimeLog(timeLog)}
                          disabled={timeLog.isRunning}
                          className="hover:bg-blue-50 dark:hover:bg-slate-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTimeLog(timeLog.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          disabled={timeLog.isRunning}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal pour créer/modifier un log */}
        <TimeLogModal
          timeLog={selectedTimeLog}
          open={timeLogModalOpen}
          onOpenChange={setTimeLogModalOpen}
          onSuccess={(action) => {
            // Refetch après chaque opération pour garantir la synchronisation
            fetchTimeLogs()
            setSelectedTimeLog(null)
          }}
        />
      </div>
    </MainLayout>
  )
} 