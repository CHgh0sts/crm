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
import { CreateNoteData, UpdateNoteData, Note } from '@/hooks/use-notes'
import { useClients } from '@/hooks/use-clients'
import { useProjects } from '@/hooks/use-projects'

interface NoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note?: Note | null
  onSubmit: (data: CreateNoteData | UpdateNoteData) => Promise<any>
  loading?: boolean
}

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'Général', color: '#6B7280', icon: '📝' },
  { value: 'PROJECT', label: 'Projet', color: '#3B82F6', icon: '📁' },
  { value: 'CLIENT', label: 'Client', color: '#10B981', icon: '👥' },
  { value: 'MEETING', label: 'Réunion', color: '#F59E0B', icon: '📅' },
  { value: 'IDEA', label: 'Idée', color: '#8B5CF6', icon: '💡' },
  { value: 'TASK', label: 'Tâche', color: '#EF4444', icon: '✅' },
] as const

const NOTE_COLORS = [
  '#FBBF24', // yellow
  '#34D399', // green
  '#60A5FA', // blue
  '#F87171', // red
  '#A78BFA', // purple
  '#FB7185', // pink
  '#F97316', // orange
  '#6B7280', // gray
]

export function NoteModal({ 
  open, 
  onOpenChange, 
  note, 
  onSubmit, 
  loading = false 
}: NoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Modifier la note' : 'Nouvelle note'}
          </DialogTitle>
        </DialogHeader>
        
        {open && (
          <NoteModalContent
            note={note}
            onSubmit={onSubmit}
            loading={loading}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function NoteModalContent({ 
  note, 
  onSubmit, 
  loading,
  onClose
}: { 
  note?: Note | null
  onSubmit: (data: CreateNoteData | UpdateNoteData) => Promise<any>
  loading: boolean
  onClose: () => void
}) {
  const { clients } = useClients()
  const { projects } = useProjects()
  
  const [formData, setFormData] = useState<CreateNoteData | UpdateNoteData>({
    title: '',
    content: '',
    type: 'GENERAL',
    projectId: undefined,
    clientId: undefined,
    isPinned: false,
    isArchived: false,
    color: NOTE_COLORS[0],
  })

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        type: note.type,
        projectId: note.projectId,
        clientId: note.clientId,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        color: note.color || NOTE_COLORS[0],
      })
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'GENERAL',
        projectId: undefined,
        clientId: undefined,
        isPinned: false,
        isArchived: false,
        color: NOTE_COLORS[0],
      })
    }
  }, [note])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title?.trim() || !formData.content?.trim()) {
      return
    }

    const result = await onSubmit(formData)

    if (result) {
      onClose()
    }
  }

  const handleChange = (field: keyof (CreateNoteData | UpdateNoteData), value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const selectedType = NOTE_TYPES.find(t => t.value === formData.type)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type et couleur */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de note</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <div className="flex space-x-2">
                                 {NOTE_COLORS.map((color) => (
                   <button
                     key={color}
                     type="button"
                     title={`Sélectionner la couleur ${color}`}
                     className={`w-8 h-8 rounded-full border-2 ${
                       formData.color === color ? 'border-gray-800' : 'border-gray-300'
                     }`}
                     style={{ backgroundColor: color }}
                     onClick={() => handleChange('color', color)}
                   />
                 ))}
              </div>
            </div>
          </div>

          {/* Associations */}
          {(formData.type === 'PROJECT' || formData.type === 'CLIENT') && (
            <div className="grid grid-cols-2 gap-4">
              {formData.type === 'PROJECT' && (
                <div className="space-y-2">
                  <Label htmlFor="projectId">Projet associé</Label>
                  <Select
                    value={formData.projectId || ''}
                    onValueChange={(value) => handleChange('projectId', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun projet</SelectItem>
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
              )}

              {formData.type === 'CLIENT' && (
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client associé</Label>
                  <Select
                    value={formData.clientId || ''}
                    onValueChange={(value) => handleChange('clientId', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titre de la note"
              required
            />
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Contenu de la note..."
              rows={8}
              required
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={(checked) => handleChange('isPinned', checked)}
                />
                <Label htmlFor="isPinned" className="text-sm font-medium">
                  📌 Épingler
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isArchived"
                  checked={formData.isArchived}
                  onCheckedChange={(checked) => handleChange('isArchived', checked)}
                />
                <Label htmlFor="isArchived" className="text-sm font-medium">
                  📦 Archiver
                </Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
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
              disabled={loading || !formData.title?.trim() || !formData.content?.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (note ? 'Modification...' : 'Création...') : (note ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
  )
} 