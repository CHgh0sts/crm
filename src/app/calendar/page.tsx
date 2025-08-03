'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  FileText,
} from 'lucide-react'
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  type: 'MEETING' | 'DEADLINE' | 'TASK' | 'OTHER'
  color: string
  allDay: boolean
  clientId?: string
  projectId?: string
  location?: string
}

// Événements d'exemple
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Réunion client ABC',
    description: 'Point sur le projet e-commerce',
    startDate: '2024-01-15T10:00:00',
    endDate: '2024-01-15T11:30:00',
    type: 'MEETING',
    color: '#3B82F6',
    allDay: false,
    location: 'Bureau',
  },
  {
    id: '2',
    title: 'Deadline projet XYZ',
    startDate: '2024-01-20T23:59:00',
    endDate: '2024-01-20T23:59:00',
    type: 'DEADLINE',
    color: '#EF4444',
    allDay: true,
  },
  {
    id: '3',
    title: 'Formation équipe',
    description: 'Formation sur les nouvelles technologies',
    startDate: '2024-01-25T14:00:00',
    endDate: '2024-01-25T17:00:00',
    type: 'OTHER',
    color: '#10B981',
    allDay: false,
  },
]

const EVENT_TYPES = [
  { value: 'MEETING', label: 'Réunion', color: '#3B82F6' },
  { value: 'DEADLINE', label: 'Échéance', color: '#EF4444' },
  { value: 'TASK', label: 'Tâche', color: '#F59E0B' },
  { value: 'OTHER', label: 'Autre', color: '#10B981' },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startDate)
      return isSameDay(eventDate, day)
    })
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    setShowEventModal(true)
    setSelectedEvent(null)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setSelectedDate(new Date())
    setShowEventModal(true)
  }

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gérez vos événements et échéances</p>
          </div>
          <Button onClick={handleCreateEvent} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        {/* Calendar Navigation */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="hover:bg-blue-50 dark:hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <Button variant="outline" size="sm" onClick={goToNextMonth} className="hover:bg-blue-50 dark:hover:bg-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday} className="hover:bg-blue-50 dark:hover:bg-slate-700">
                Aujourd'hui
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-700/50' : 'bg-gray-50/50 dark:bg-slate-900/50 text-gray-400'}
                      ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                      border-blue-200/30 dark:border-slate-600/50
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded text-white truncate"
                          style={{ backgroundColor: event.color }}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          {!event.allDay && (
                            <span className="mr-1">
                              {format(parseISO(event.startDate), 'HH:mm')}
                            </span>
                          )}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 p-1">
                          +{dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {events
                .filter(event => new Date(event.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-50/50 dark:hover:bg-slate-700/50 cursor-pointer border-blue-200/30 dark:border-slate-600/50 transition-colors"
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                        <Badge variant="secondary">
                          {EVENT_TYPES.find(t => t.value === event.type)?.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-4">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {format(parseISO(event.startDate), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        {!event.allDay && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(parseISO(event.startDate), 'HH:mm')}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {events.filter(event => new Date(event.startDate) >= new Date()).length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Aucun événement à venir</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Modal */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={(eventData) => {
          if (selectedEvent) {
            // Update existing event
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, ...eventData } : e))
          } else {
            // Create new event
            const newEvent: CalendarEvent = {
              id: Date.now().toString(),
              ...eventData,
              color: EVENT_TYPES.find(t => t.value === eventData.type)?.color || '#3B82F6',
            }
            setEvents(prev => [...prev, newEvent])
          }
          setShowEventModal(false)
        }}
        onDelete={selectedEvent ? (id) => {
          setEvents(prev => prev.filter(e => e.id !== id))
          setShowEventModal(false)
        } : undefined}
      />
    </MainLayout>
  )
}

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  selectedDate?: Date | null
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'color'>) => void
  onDelete?: (id: string) => void
}

function EventModal({ open, onOpenChange, event, selectedDate, onSave, onDelete }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    type: 'MEETING' as 'MEETING' | 'DEADLINE' | 'TASK' | 'OTHER',
    allDay: false,
    location: '',
  })

  useEffect(() => {
    if (event) {
      const startDate = parseISO(event.startDate)
      const endDate = parseISO(event.endDate)
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: event.allDay ? '' : format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: event.allDay ? '' : format(endDate, 'HH:mm'),
        type: event.type,
        allDay: event.allDay,
        location: event.location || '',
      })
    } else if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      setFormData({
        title: '',
        description: '',
        startDate: dateStr,
        startTime: '09:00',
        endDate: dateStr,
        endTime: '10:00',
        type: 'MEETING',
        allDay: false,
        location: '',
      })
    }
  }, [event, selectedDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startDateTime = formData.allDay 
      ? `${formData.startDate}T00:00:00`
      : `${formData.startDate}T${formData.startTime}:00`
    
    const endDateTime = formData.allDay
      ? `${formData.endDate}T23:59:59`
      : `${formData.endDate}T${formData.endTime}:00`

    onSave({
      title: formData.title,
      description: formData.description,
      startDate: startDateTime,
      endDate: endDateTime,
      type: formData.type,
      allDay: formData.allDay,
      location: formData.location,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de l'événement"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type d'événement</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
              className="rounded"
              aria-label="Toute la journée"
            />
            <Label htmlFor="allDay">Toute la journée</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            {!formData.allDay && (
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
            {!formData.allDay && (
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Lieu de l'événement"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'événement"
              rows={3}
            />
          </div>

          <div className="flex justify-between">
            <div>
              {event && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(event.id)}
                >
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {event ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 