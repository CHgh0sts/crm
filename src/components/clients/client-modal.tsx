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
import { Client, CreateClientData } from '@/hooks/use-clients'
import { Building2, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react'

const clientSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis'),
  company: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']).default('ACTIVE'),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
  onSubmit: (data: CreateClientData) => Promise<void>
  loading?: boolean
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Actif', color: 'bg-green-500' },
  { value: 'INACTIVE', label: 'Inactif', color: 'bg-gray-500' },
  { value: 'PROSPECT', label: 'Prospect', color: 'bg-blue-500' },
]

export function ClientModal({ open, onOpenChange, client, onSubmit, loading }: ClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'ACTIVE',
    },
  })

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        website: client.website || '',
        notes: client.notes || '',
        status: client.status,
      })
    } else {
      reset({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        website: '',
        notes: '',
        status: 'ACTIVE',
      })
    }
  }, [client, reset])

  const onFormSubmit = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true)
      
      const submitData: CreateClientData = {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        website: data.website,
        notes: data.notes,
        status: data.status,
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
            {client ? 'Modifier le client' : 'Nouveau client'}
          </DialogTitle>
          <DialogDescription>
            {client 
              ? 'Modifiez les informations de votre client.'
              : 'Ajoutez un nouveau client à votre portefeuille.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du client *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Ex: Jean Dupont"
                    className="pl-10"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  placeholder="Ex: ACME Corp"
                  {...register('company')}
                />
              </div>
            </div>

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
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contact</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@exemple.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+33 1 23 45 67 89"
                    className="pl-10"
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.exemple.com"
                  className="pl-10"
                  {...register('website')}
                />
              </div>
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Adresse</h4>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="123 Rue de la Paix"
                  className="pl-10"
                  {...register('address')}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  {...register('city')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  placeholder="75001"
                  {...register('postalCode')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  placeholder="France"
                  {...register('country')}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Informations supplémentaires sur le client..."
              className="min-h-[80px]"
              {...register('notes')}
            />
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
                  {client ? 'Modification...' : 'Création...'}
                </>
              ) : (
                client ? 'Modifier' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 