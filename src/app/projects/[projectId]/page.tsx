'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading'
import { useProjects, Project } from '@/hooks/use-projects'
import { useTasks, Task } from '@/hooks/use-tasks'
import { useTimeLogs } from '@/hooks/use-time-tracking'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Archive, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Users, 
  Target,
  Plus,
  MoreVertical,
  FolderOpen,
  Timer,
  FileText
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TaskModal } from '@/components/projects/task-modal'
import { ProjectModal } from '@/components/projects/project-modal'

const statusConfig = {
  PLANNING: { label: 'Planification', color: 'bg-gray-500' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-500' },
  ON_HOLD: { label: 'En pause', color: 'bg-yellow-500' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-500' },
}

const priorityConfig = {
  LOW: { label: 'Faible', color: 'bg-gray-500' },
  MEDIUM: { label: 'Moyenne', color: 'bg-blue-500' },
  HIGH: { label: 'Haute', color: 'bg-orange-500' },
  URGENT: { label: 'Urgente', color: 'bg-red-500' },
}

const taskStatusConfig = {
  TODO: { label: 'À faire', color: 'bg-gray-500' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-blue-500' },
  IN_REVIEW: { label: 'En révision', color: 'bg-yellow-500' },
  COMPLETED: { label: 'Terminé', color: 'bg-green-500' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-500' },
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const { fetchProject, deleteProject } = useProjects()
  const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTasks()
  const { timeLogs, stats, fetchTimeLogs } = useTimeLogs()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()

  useEffect(() => {
    const loadProjectDetails = async () => {
      setLoading(true)
      try {
        const projectData = await fetchProject(projectId)
        if (projectData) {
          setProject(projectData)
          // Charger les tâches du projet
          await fetchTasks({ projectId })
          // Charger les logs de temps
          await fetchTimeLogs({ projectId })
        } else {
          router.push('/projects')
        }
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProjectDetails()
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteProject = async () => {
    if (!project) return
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      const success = await deleteProject(project.id)
      if (success) {
        router.push('/projects')
      }
    }
  }

  const handleCreateTask = () => {
    setEditingTask(undefined)
    setTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskModalOpen(true)
  }

  const handleTaskSubmit = async (taskData: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData)
    } else {
      await createTask({ ...taskData, projectId })
    }
    await fetchTasks({ projectId })
    setTaskModalOpen(false)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      await deleteTask(taskId)
      await fetchTasks({ projectId })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-muted-foreground">Projet non trouvé</h1>
        <Button className="mt-4" onClick={() => router.push('/projects')}>
          Retour aux projets
        </Button>
      </div>
    )
  }

  const projectTasks = tasks.filter(task => task.project?.id === projectId)
  const completedTasks = projectTasks.filter(task => task.status === 'COMPLETED')
  const totalTimeSpent = timeLogs.reduce((acc: number, log: any) => acc + (log.duration || 0), 0)

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/projects')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shrink-0" 
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge 
                  variant="outline" 
                  className={`${statusConfig[project.status]?.color} text-white border-0`}
                >
                  {statusConfig[project.status]?.label}
                </Badge>
                <Badge 
                  variant="outline"
                  className={`${priorityConfig[project.priority]?.color} text-white border-0`}
                >
                  {priorityConfig[project.priority]?.label}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectModalOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setProjectModalOpen(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier le projet
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteProject}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression</p>
                <p className="text-2xl font-bold">{project.progress}%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches</p>
                <p className="text-2xl font-bold">
                  {completedTasks.length}/{projectTasks.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps passé</p>
                <p className="text-2xl font-bold">
                  {Math.floor(totalTimeSpent / 60)}h {totalTimeSpent % 60}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">
                  {project.budget ? `${project.budget.toLocaleString()}€` : 'N/A'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Info & Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tasks">Tâches ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="time">Suivi du temps</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations générales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    <Badge className={`${statusConfig[project.status]?.color} text-white border-0 mt-1`}>
                      {statusConfig[project.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Priorité</p>
                    <Badge className={`${priorityConfig[project.priority]?.color} text-white border-0 mt-1`}>
                      {priorityConfig[project.priority]?.label}
                    </Badge>
                  </div>
                  {project.startDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date de début</p>
                      <p className="text-sm">
                        {format(new Date(project.startDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
                      <p className="text-sm">
                        {format(new Date(project.endDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>

                {project.client && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Client</p>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {project.client.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{project.client.name}</p>
                        {project.client.company && (
                          <p className="text-sm text-muted-foreground">{project.client.company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {project.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Catégorie</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.category.color }}
                      />
                      <span className="text-sm">{project.category.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activité récente */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeLogs
                    .filter(log => log.project?.id === projectId)
                    .slice(0, 5)
                    .map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm">{log.description || 'Temps de travail'}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {timeLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tâches du projet</h3>
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>

          <div className="grid gap-4">
            {projectTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline"
                        className={`${taskStatusConfig[task.status]?.color} text-white border-0`}
                      >
                        {taskStatusConfig[task.status]?.label}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${priorityConfig[task.priority]?.color} text-white border-0`}
                      >
                        {priorityConfig[task.priority]?.label}
                      </Badge>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTask(task)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback>
                              {(task.assignee.firstName?.charAt(0) || '') + (task.assignee.lastName?.charAt(0) || '')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {task.totalTimeSpentHours}h
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {projectTasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Aucune tâche</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre première tâche pour commencer à organiser ce projet.
                  </p>
                  <Button onClick={handleCreateTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une tâche
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <h3 className="text-lg font-semibold">Suivi du temps</h3>
          
          <div className="grid gap-4">
            {timeLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{log.description || 'Session de travail'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.startTime), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        {log.endTime && ` - ${format(new Date(log.endTime), 'HH:mm')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {log.duration ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m` : 'En cours...'}
                      </p>
                      {log.isBillable && (
                        <Badge variant="outline" className="text-xs">
                          Facturable
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {timeLogs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Aucun temps enregistré</h3>
                  <p className="text-muted-foreground">
                    Le suivi du temps vous permettra de mesurer le temps passé sur ce projet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <h3 className="text-lg font-semibold">Notes du projet</h3>
          
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Fonctionnalité à venir</h3>
              <p className="text-muted-foreground">
                Le système de notes sera bientôt disponible pour ce projet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          onSubmit={handleTaskSubmit}
          task={editingTask}
          defaultProjectId={projectId}
        />
      )}

      {projectModalOpen && (
        <ProjectModal
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
          onSubmit={async (projectData) => {
            // This will be handled by the project modal
            setProjectModalOpen(false)
            // Refresh project data
            const updatedProject = await fetchProject(projectId)
            if (updatedProject) {
              setProject(updatedProject)
            }
          }}
          project={project}
        />
      )}
    </div>
    </MainLayout>
  )
} 