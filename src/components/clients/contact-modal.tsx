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
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading'
import { Contact } from '@/hooks/use-clients'
import { User, Mail, Phone, Building2, FileText } from 'lucide-react'

const contactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  isPrimary: z.boolean(),
})

type ContactFormData = z.infer<typeof contactSchema>

export interface CreateContactData {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  position?: string
  notes?: string
  isPrimary: boolean
  clientId: string
}

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
  clientId: string
  onSubmit: (data: CreateContactData) => Promise<void>
  loading?: boolean
}

export function ContactModal({ open, onOpenChange, contact, clientId, onSubmit, loading }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      notes: '',
      isPrimary: false,
    }
  })

  const isPrimary = watch('isPrimary')

  useEffect(() => {
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        notes: contact.notes || '',
        isPrimary: contact.isPrimary,
      })
    } else if (open) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        notes: '',
        isPrimary: false,
      })
    }
  }, [contact, open, reset])

  const onSubmitForm = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true)
      
      const contactData: CreateContactData = {
        ...data,
        clientId,
        email: data.email || undefined,
        phone: data.phone || undefined,
        position: data.position || undefined,
        notes: data.notes || undefined,
        lastName: data.lastName || undefined,
      }

      await onSubmit(contactData)
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {contact ? 'Modifier le contact' : 'Ajouter un contact'}
          </DialogTitle>
          <DialogDescription>
            {contact 
              ? 'Modifiez les informations du contact.' 
              : 'Ajoutez un nouveau contact pour ce client.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="w-4 h-4" />
              Informations personnelles
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="Jean"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Dupont"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste/Fonction</Label>
              <Input
                id="position"
                {...register('position')}
                placeholder="Directeur commercial"
                className="flex items-center"
              />
              {errors.position && (
                <p className="text-sm text-red-600">{errors.position.message}</p>
              )}
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="w-4 h-4" />
              Informations de contact
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="jean.dupont@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="01 23 45 67 89"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setValue('isPrimary', !!checked)}
              />
              <Label 
                htmlFor="isPrimary" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Contact principal
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              Le contact principal sera utilisé par défaut pour les communications.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notes additionnelles..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || loading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {contact ? 'Modifier' : 'Ajouter'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 