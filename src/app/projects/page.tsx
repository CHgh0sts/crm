'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import { ProjectModal } from '@/components/projects/project-modal'
import { useProjects, Project } from '@/hooks/use-projects'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Edit,
  Archive,
  Eye,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusConfig = {
  PLANNING: { label: 'Planification', color: 'bg-gray-500', variant: 'secondary' as const },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-500', variant: 'default' as const },
  ON_HOLD: { label: 'En pause', color: 'bg-orange-500', variant: 'destructive' as const },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500', variant: 'default' as const },
  CANCELLED: { label: 'Annulé', color: 'bg-red-500', variant: 'destructive' as const },
}

const priorityConfig = {
  LOW: { label: 'Faible', variant: 'secondary' as const },
  MEDIUM: { label: 'Moyenne', variant: 'outline' as const },
  HIGH: { label: 'Élevée', variant: 'destructive' as const },
  URGENT: { label: 'Urgente', variant: 'destructive' as const },
}

function ProjectCard({ project, onEdit, onArchive }: { 
  project: Project
  onEdit: (project: Project) => void
  onArchive: (project: Project) => void
}) {
  const router = useRouter()
  const completionRate = project.tasksCount > 0 
    ? Math.round((project.completedTasks / project.tasksCount) * 100)
    : 0

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`)
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la propagation pour que le clic sur le dropdown n'active pas la navigation
  }

  return (
    <Card 
      className="group hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start space-x-3">
          <div 
            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        
        <div onClick={handleDropdownClick}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les détails
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onArchive(project)}
                className="text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Badges de statut et priorité */}
        <div className="flex items-center space-x-2">
          <Badge variant={statusConfig[project.status].variant}>
            {statusConfig[project.status].label}
          </Badge>
          <Badge variant={priorityConfig[project.priority].variant}>
            {priorityConfig[project.priority].label}
          </Badge>
          {project.client && (
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {project.client.name}
            </Badge>
          )}
        </div>

        {/* Progression des tâches */}
        {project.tasksCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{project.completedTasks}/{project.tasksCount} tâches</span>
              {project.timeLogsCount > 0 && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {project.timeLogsCount} sessions
                </span>
              )}
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            {project.endDate && (
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(project.endDate), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
            )}
            {project.budget && (
              <span className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                {project.budget.toLocaleString()} €
              </span>
            )}
          </div>
          <span>
            Mis à jour {formatDistanceToNow(new Date(project.updatedAt), { 
              addSuffix: true, 
              locale: fr 
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects()
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredProjects = projects?.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  }) || []

  const stats = {
    total: projects?.length || 0,
    inProgress: projects?.filter((p: Project) => p.status === 'IN_PROGRESS').length || 0,
    completed: projects?.filter((p: Project) => p.status === 'COMPLETED').length || 0,
    planning: projects?.filter((p: Project) => p.status === 'PLANNING').length || 0,
  }

  const handleCreateProject = () => {
    setEditingProject(undefined)
    setProjectModalOpen(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectModalOpen(true)
  }

  const handleModalClose = () => {
    setProjectModalOpen(false)
    setEditingProject(undefined)
  }

  const handleArchiveProject = (project: Project) => {
    // Implémentation de l'archivage
    console.log('Archive project:', project.id)
  }

  if (loading) return <PageLoading />
  if (error) return <div>Erreur: {error}</div>

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projets</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gérez et suivez l'avancement de tous vos projets
            </p>
          </div>
          <Button 
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex items-center p-6 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Planification</p>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.planning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-800/80 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/8 dark:shadow-slate-900/40">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent dark:from-blue-400/6 dark:via-transparent dark:to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PLANNING">Planification</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="ON_HOLD">En pause</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
              <FolderOpen className="h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Aucun projet trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Aucun projet ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre premier projet.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un projet
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onArchive={handleArchiveProject}
              />
            ))}
          </div>
        )}

        {/* Modal de création/édition */}
        <ProjectModal
          open={projectModalOpen}
          onOpenChange={handleModalClose}
          project={editingProject}
          onSubmit={async (data) => {
            // Implémentation de la création/édition
            console.log('Project data:', data)
            handleModalClose()
          }}
        />
      </div>
    </MainLayout>
  )
} 