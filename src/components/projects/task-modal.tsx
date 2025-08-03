'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading'
import { Task, CreateTaskData } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { useAuth } from '@/components/providers/auth-provider'
import { Calendar, Clock, Flag, User } from 'lucide-react'

const taskSchema = z.object({
  title: z.string().min(1, 'Le titre de la tâche est requis'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTaskData) => Promise<void>
  task?: Task
  defaultProjectId?: string
}

export function TaskModal({ open, onOpenChange, onSubmit, task, defaultProjectId }: TaskModalProps) {
  const { user } = useAuth()
  const { projects, fetchProjects } = useProjects()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      projectId: defaultProjectId || 'none',
    },
  })

  // Charger les projets au montage
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Préremplir le formulaire si on modifie une tâche
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours?.toString() || '',
        projectId: task.project?.id || defaultProjectId || 'none',
        assigneeId: task.assignee?.id || '',
      })
    } else {
      reset({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        estimatedHours: '',
        projectId: defaultProjectId || 'none',
        assigneeId: '',
      })
    }
  }, [task, reset, defaultProjectId])

  const onFormSubmit = async (data: TaskFormData) => {
    setLoading(true)
    try {
      const taskData: CreateTaskData = {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
        projectId: data.projectId && data.projectId !== 'none' ? data.projectId : undefined,
        assigneeId: data.assigneeId || undefined,
      }
      
      await onSubmit(taskData)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tâche:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Modifiez les informations de la tâche.' 
              : 'Créez une nouvelle tâche pour organiser votre travail.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Titre de la tâche"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la tâche..."
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Ligne 1: Statut et Priorité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">À faire</SelectItem>
                    <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                    <SelectItem value="IN_REVIEW">En révision</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ligne 2: Projet et Date d'échéance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projet</Label>
                <Select
                  value={watch('projectId')}
                  onValueChange={(value) => setValue('projectId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun projet</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    className="pl-10"
                    {...register('dueDate')}
                  />
                </div>
              </div>
            </div>

            {/* Temps estimé */}
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Temps estimé (heures)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="Ex: 2.5"
                  step="0.5"
                  min="0"
                  className="pl-10"
                  {...register('estimatedHours')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Sauvegarde...
                </>
              ) : (
                task ? 'Modifier' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 