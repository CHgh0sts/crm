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
import { Project, CreateProjectData } from '@/hooks/use-projects'
import { useClients } from '@/hooks/use-clients'
import { Calendar, DollarSign, Palette, User } from 'lucide-react'

const projectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  color: z.string().default('#3B82F6'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  clientId: z.string().optional(),
  categoryId: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  onSubmit: (data: CreateProjectData) => Promise<void>
  loading?: boolean
}

const statusOptions = [
  { value: 'PLANNING', label: 'Planification', color: 'bg-gray-500' },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'bg-blue-500' },
  { value: 'ON_HOLD', label: 'En pause', color: 'bg-orange-500' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-500' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Faible', color: 'bg-gray-400' },
  { value: 'MEDIUM', label: 'Moyenne', color: 'bg-blue-400' },
  { value: 'HIGH', label: 'Élevée', color: 'bg-orange-400' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-400' },
]

const colorOptions = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

export function ProjectModal({ open, onOpenChange, project, onSubmit, loading }: ProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { clients } = useClients()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'PLANNING',
      priority: 'MEDIUM',
      color: '#3B82F6',
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        color: project.color,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        budget: project.budget?.toString() || '',
        clientId: project.client?.id || '',
        categoryId: project.category?.id || '',
      })
    } else {
      reset({
        name: '',
        description: '',
        status: 'PLANNING',
        priority: 'MEDIUM',
        color: '#3B82F6',
        startDate: '',
        endDate: '',
        budget: '',
        clientId: '',
        categoryId: '',
      })
    }
  }, [project, reset])

  const onFormSubmit = async (data: ProjectFormData) => {
    try {
      setIsSubmitting(true)
      
      const submitData: CreateProjectData = {
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        color: data.color,
        budget: data.budget ? parseFloat(data.budget) : undefined,
        clientId: data.clientId || undefined,
        categoryId: data.categoryId || undefined,
      }

      if (data.startDate) {
        submitData.startDate = data.startDate
      }

      if (data.endDate) {
        submitData.endDate = data.endDate
      }

      await onSubmit(submitData)
      onOpenChange(false)
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Modifier le projet' : 'Nouveau projet'}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? 'Modifiez les informations de votre projet.'
              : 'Créez un nouveau projet pour organiser vos tâches et suivre votre progression.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                placeholder="Ex: Site web e-commerce"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre projet..."
                className="min-h-[80px]"
                {...register('description')}
              />
            </div>
          </div>

          {/* Statut et priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${option.color} mr-2`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value: any) => setValue('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${option.color} mr-2`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Couleur du projet
            </Label>
            <div className="flex space-x-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  title={`Sélectionner la couleur ${color}`}
                  aria-label={`Sélectionner la couleur ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date de début
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date de fin
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget (€)
            </Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="Ex: 5000"
              {...register('budget')}
            />
          </div>

          {/* Sélection du client */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Client associé (optionnel)
            </Label>
            <Select
              value={watch('clientId')}
              onValueChange={(value) => setValue('clientId', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {client.company && (
                          <div className="text-xs text-muted-foreground">{client.company}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Aucun client disponible. Créez un client dans la section Clients.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  {project ? 'Modification...' : 'Création...'}
                </>
              ) : (
                project ? 'Modifier' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 