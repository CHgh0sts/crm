import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export interface Note {
  id: string
  title: string
  content: string
  type: 'GENERAL' | 'PROJECT' | 'CLIENT' | 'MEETING' | 'IDEA' | 'TASK'
  projectId?: string
  clientId?: string
  taskId?: string
  isPinned: boolean
  isArchived: boolean
  isMarkdown?: boolean
  color?: string
  userId: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    name: string
    color: string
    client?: {
      id: string
      name: string
      company?: string
    }
  }
  client?: {
    id: string
    name: string
    company?: string
  }
  task?: {
    id: string
    title: string
    status: string
    priority: string
  }
  user?: {
    id: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

export interface CreateNoteData {
  title: string
  content: string
  type?: 'GENERAL' | 'PROJECT' | 'CLIENT' | 'MEETING' | 'IDEA' | 'TASK'
  projectId?: string
  clientId?: string
  taskId?: string
  isPinned?: boolean
  isArchived?: boolean
  color?: string
}

export interface UpdateNoteData {
  title?: string
  content?: string
  type?: 'GENERAL' | 'PROJECT' | 'CLIENT' | 'MEETING' | 'IDEA' | 'TASK'
  projectId?: string | null
  clientId?: string | null
  taskId?: string | null
  isPinned?: boolean
  isArchived?: boolean
  color?: string
}

export interface NotesFilters {
  type?: string
  projectId?: string
  clientId?: string
  taskId?: string
  isPinned?: boolean
  isArchived?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface NotesPagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export function useNotes(filters: NotesFilters = {}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [pagination, setPagination] = useState<NotesPagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.projectId) params.append('projectId', filters.projectId)
    if (filters.clientId) params.append('clientId', filters.clientId)
    if (filters.taskId) params.append('taskId', filters.taskId)
    if (filters.isPinned !== undefined) params.append('isPinned', filters.isPinned.toString())
    if (filters.isArchived !== undefined) params.append('isArchived', filters.isArchived.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    return params.toString()
  }, [filters.type, filters.projectId, filters.clientId, filters.taskId, filters.isPinned, filters.isArchived, filters.search, filters.page, filters.limit])

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notes${queryString ? `?${queryString}` : ''}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notes')
      }

      const data = await response.json()
      setNotes(data.notes)
      setPagination(data.pagination)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  const createNote = useCallback(async (data: CreateNoteData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création de la note')
      }

      const newNote = await response.json()
      setNotes(prev => [newNote, ...prev])
      toast.success('Note créée avec succès')
      return newNote
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNote = useCallback(async (id: string, data: UpdateNoteData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la note')
      }

      const updatedNote = await response.json()
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      toast.success('Note mise à jour avec succès')
      return updatedNote
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression de la note')
      }

      setNotes(prev => prev.filter(note => note.id !== id))
      toast.success('Note supprimée avec succès')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const togglePin = useCallback(async (id: string, isPinned: boolean) => {
    return updateNote(id, { isPinned })
  }, [updateNote])

  const toggleArchive = useCallback(async (id: string, isArchived: boolean) => {
    return updateNote(id, { isArchived })
  }, [updateNote])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    pagination,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
  }
}

export function useNote(id: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNote = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/notes/${id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la note')
      }

      const data = await response.json()
      setNote(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  return {
    note,
    loading,
    error,
    refetch: fetchNote,
  }
} 