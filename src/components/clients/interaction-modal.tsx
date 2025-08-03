'use client'

import { useState } from 'react'
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
import { CreateInteractionData } from '@/hooks/use-interactions'

interface InteractionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateInteractionData) => Promise<any>
  loading?: boolean
}

const INTERACTION_TYPES = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Téléphone' },
  { value: 'MEETING', label: 'Réunion' },
  { value: 'NOTE', label: 'Note' },
  { value: 'PROPOSAL', label: 'Proposition' },
] as const

export function InteractionModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading = false 
}: InteractionModalProps) {
  const [formData, setFormData] = useState<CreateInteractionData>({
    type: 'EMAIL',
    subject: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim()) {
      return
    }

    const result = await onSubmit({
      ...formData,
      date: new Date(formData.date).toISOString(),
    })

    if (result) {
      // Reset form and close modal
      setFormData({
        type: 'EMAIL',
        subject: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
      onOpenChange(false)
    }
  }

  const handleChange = (field: keyof CreateInteractionData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle Interaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Type d'interaction */}
            <div className="space-y-2">
              <Label htmlFor="type">Type d'interaction *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Sujet de l'interaction"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description détaillée de l'interaction..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.subject.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Création...' : 'Créer l\'interaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 