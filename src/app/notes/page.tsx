'use client'

import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoading } from '@/components/ui/loading'
import { NoteModal } from '@/components/notes/note-modal'
import { useNotes, Note, CreateNoteData, UpdateNoteData } from '@/hooks/use-notes'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  StickyNote,
  Clock,
  Building2,
  FolderOpen,
  Calendar,
  Lightbulb,
  CheckSquare,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const NOTE_TYPES = [
  { value: 'GENERAL', label: 'Général', color: '#6B7280', icon: StickyNote },
  { value: 'PROJECT', label: 'Projet', color: '#3B82F6', icon: FolderOpen },
  { value: 'CLIENT', label: 'Client', color: '#10B981', icon: Building2 },
  { value: 'MEETING', label: 'Réunion', color: '#F59E0B', icon: Calendar },
  { value: 'IDEA', label: 'Idée', color: '#8B5CF6', icon: Lightbulb },
  { value: 'TASK', label: 'Tâche', color: '#EF4444', icon: CheckSquare },
] as const

interface NotesFiltersState {
  type: string
  search: string
  isPinned?: boolean
  isArchived?: boolean
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive }: {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
  onTogglePin: (note: Note) => void
  onToggleArchive: (note: Note) => void
}) {
  const noteType = NOTE_TYPES.find(type => type.value === note.type)
  const IconComponent = noteType?.icon || StickyNote

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-200 relative bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50 hover:shadow-xl"
      style={{ borderLeft: `4px solid ${note.color || noteType?.color || '#6B7280'}` }}
    >
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
      {note.isPinned && (
        <div className="absolute top-2 right-2 z-20">
          <Pin className="w-4 h-4 text-blue-600" />
        </div>
      )}
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <IconComponent className="w-4 h-4" style={{ color: noteType?.color }} />
              <Badge variant="secondary" className="text-xs">
                {noteType?.label}
              </Badge>
              {note.project && (
                <Badge variant="outline" className="text-xs">
                  📁 {note.project.name}
                </Badge>
              )}
              {note.client && (
                <Badge variant="outline" className="text-xs">
                  👥 {note.client.name}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate text-gray-900 dark:text-white">{note.title}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(note)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(note)}>
                {note.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Désépingler
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Épingler
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleArchive(note)}>
                {note.isArchived ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Désarchiver
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(note)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {note.content}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(note.updatedAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          </div>
          
          {note.user && (
            <div className="flex items-center space-x-1">
              <span>par</span>
              <span className="font-medium">
                {note.user.firstName} {note.user.lastName}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotesPage() {
  const [filters, setFilters] = useState<NotesFiltersState>({
    type: 'all',
    search: '',
    isArchived: false,
  })
  
  const [activeTab, setActiveTab] = useState('all')
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [mounted, setMounted] = useState(false)

  // Déterminer les filtres selon l'onglet actif avec useMemo pour éviter les re-renders
  const currentFilters = useMemo(() => {
    const baseFilters = {
      search: filters.search,
      type: filters.type === 'all' ? undefined : filters.type,
    }

    switch (activeTab) {
      case 'pinned':
        return { ...baseFilters, isPinned: true, isArchived: false }
      case 'archived':
        return { ...baseFilters, isArchived: true }
      default:
        return { ...baseFilters, isArchived: false }
    }
  }, [filters.search, filters.type, activeTab])

  const { notes, loading, createNote, updateNote, deleteNote, togglePin, toggleArchive } = useNotes(
    currentFilters
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateNote = async (data: CreateNoteData) => {
    return await createNote(data)
  }

  const handleUpdateNote = async (data: UpdateNoteData) => {
    if (editingNote) {
      return await updateNote(editingNote.id, data)
    }
    return null
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteModalOpen(true)
  }

  const handleDeleteNote = async (note: Note) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la note "${note.title}" ?`)) {
      await deleteNote(note.id)
    }
  }

  const handleTogglePin = async (note: Note) => {
    await togglePin(note.id, !note.isPinned)
  }

  const handleToggleArchive = async (note: Note) => {
    await toggleArchive(note.id, !note.isArchived)
  }

  const handleModalClose = () => {
    setNoteModalOpen(false)
    setEditingNote(null)
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setNoteModalOpen(true)
  }

  // Grouper les notes épinglées et normales pour l'affichage
  const pinnedNotes = notes.filter(note => note.isPinned)
  const normalNotes = notes.filter(note => !note.isPinned)

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (loading) return <PageLoading />

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organisez vos idées, réunions et informations importantes
            </p>
          </div>
          <Button onClick={handleNewNote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        </div>

        {/* Stats rapides */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</CardTitle>
              <StickyNote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Épinglées</CardTitle>
              <Pin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-blue-600">{pinnedNotes.length}</div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Récentes</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-green-600">
                {notes.filter(note => {
                  const dayAgo = new Date()
                  dayAgo.setDate(dayAgo.getDate() - 1)
                  return new Date(note.updatedAt) > dayAgo
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Types</CardTitle>
              <Filter className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(notes.map(note => note.type)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les notes..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-[180px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type de note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4" style={{ color: type.color }} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-200/30 dark:border-slate-600/50">
            <TabsTrigger value="all">Toutes les notes</TabsTrigger>
            <TabsTrigger value="pinned">Épinglées</TabsTrigger>
            <TabsTrigger value="archived">Archivées</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {pinnedNotes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                  <Pin className="w-5 h-5 mr-2 text-blue-600" />
                  Notes épinglées
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onToggleArchive={handleToggleArchive}
                    />
                  ))}
                </div>
              </div>
            )}

            {normalNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                    <StickyNote className="w-5 h-5 mr-2" />
                    Autres notes
                  </h3>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {normalNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onToggleArchive={handleToggleArchive}
                    />
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
                  <StickyNote className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune note trouvée</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    {filters.search || filters.type !== 'all' 
                      ? 'Aucune note ne correspond à vos critères de recherche.'
                      : 'Commencez par créer votre première note.'
                    }
                  </p>
                  {!filters.search && filters.type === 'all' && (
                    <Button onClick={handleNewNote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une note
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pinned">
            {notes.length === 0 ? (
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
                  <Pin className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune note épinglée</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Épinglez vos notes importantes pour les retrouver facilement.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {notes.length === 0 ? (
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
                  <Archive className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucune note archivée</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                    Les notes archivées apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleArchive={handleToggleArchive}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de création/édition */}
        <NoteModal
          open={noteModalOpen}
          onOpenChange={handleModalClose}
          note={editingNote}
          onSubmit={async (data) => {
            if (editingNote) {
              return await handleUpdateNote(data as UpdateNoteData)
            } else {
              return await handleCreateNote(data as CreateNoteData)
            }
          }}
          loading={loading}
        />
      </div>
    </MainLayout>
  )
} 