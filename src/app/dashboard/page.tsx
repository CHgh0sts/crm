'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageLoading } from '@/components/ui/loading'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import {
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  FolderOpen,
  Play,
  Plus,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Pause,
} from 'lucide-react'

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  isBlue = false
}: { 
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
  isBlue?: boolean
}) => (
  <Card className="relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 hover:shadow-lg shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50">
    {/* Aura bleue en arrière-plan */}
    <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${isBlue ? 'bg-blue-500 shadow-blue-500/30 shadow-lg' : 'bg-gray-900 dark:bg-gray-600'}`}>
        <Icon className={`h-4 w-4 ${isBlue ? 'text-white' : 'text-white'}`} />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      {trend && (
        <div className="flex items-center mt-2">
          <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
          <span className="text-xs text-green-600 dark:text-green-400">+{trend.value}% {trend.label}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'destructive'
    case 'HIGH': return 'destructive'
    case 'MEDIUM': return 'default'
    case 'LOW': return 'secondary'
    default: return 'default'
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'project': return FolderOpen
    case 'invoice': return CreditCard
    case 'client': return Users
    case 'task': return CheckCircle
    case 'time': return Clock
    default: return CheckCircle
  }
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData()

  if (loading) return <PageLoading />
  if (error) return <div>Erreur: {error}</div>
  if (!data) return <div>Aucune donnée disponible</div>

  const { stats, recentActivities, upcomingTasks, runningTimers } = data

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vue d'ensemble de votre activité freelance
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>

        {/* Running Timers */}
        {runningTimers.length > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50/60 via-blue-50 to-white dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-blue-200/70 dark:border-slate-600 shadow-lg shadow-blue-500/20 dark:shadow-slate-900/50">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/8 via-blue-500/3 to-transparent dark:from-blue-400/10 dark:via-blue-400/5 dark:to-transparent" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center text-blue-800 dark:text-blue-300">
                <Play className="h-4 w-4 mr-2" />
                Chronomètres en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {runningTimers.map((timer) => (
                  <div key={timer.id} className="flex items-center justify-between p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg border border-blue-200/30 dark:border-slate-600">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{timer.description}</p>
                      {timer.project && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{timer.project}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                        {formatDistanceToNow(timer.startTime, { locale: fr })}
                      </Badge>
                      <Button size="sm" variant="outline" className="border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">
                        <Pause className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Projets actifs"
            value={stats.activeProjects}
            description={`${stats.totalProjects} projets au total`}
            icon={FolderOpen}
            trend={{ value: 12, label: 'ce mois' }}
            isBlue={true}
          />
          <StatCard
            title="Clients"
            value={stats.totalClients}
            description="Portefeuille client"
            icon={Users}
          />
          <StatCard
            title="Revenus mensuels"
            value={`${stats.monthlyRevenue.toLocaleString()} €`}
            description={`${stats.totalRevenue.toLocaleString()} € au total`}
            icon={DollarSign}
            trend={{ value: 8, label: 'vs mois dernier' }}
          />
          <StatCard
            title="Heures cette semaine"
            value={`${stats.weeklyTimeLogged}h`}
            description={`${stats.totalTimeLogged}h au total`}
            icon={Clock}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 hover:shadow-lg transition-all duration-300 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30 border-blue-200/30 dark:border-slate-600/50">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Factures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">Payées</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  {stats.paidInvoices}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">En attente</span>
                <Badge variant="outline" className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">{stats.pendingInvoices}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">En retard</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                  {stats.overdueInvoices}
                </Badge>
              </div>
              <Progress 
                value={(stats.paidInvoices / stats.totalInvoices) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round((stats.paidInvoices / stats.totalInvoices) * 100)}% de factures payées
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 hover:shadow-lg transition-all duration-300 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30 border-blue-200/30 dark:border-slate-600/50">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Projets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">Actifs</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  {stats.activeProjects}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">Terminés</span>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {stats.completedProjects}
                </Badge>
              </div>
              <Progress 
                value={(stats.completedProjects / stats.totalProjects) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round((stats.completedProjects / stats.totalProjects) * 100)}% de projets terminés
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 hover:shadow-lg transition-all duration-300 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30 border-blue-200/30 dark:border-slate-600/50">
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Tâches à venir
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Aucune tâche à venir</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{task.project}</p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(task.dueDate, { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <Badge variant={getPriorityColor(task.priority)} className="ml-2">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  {upcomingTasks.length > 3 && (
                    <Button variant="link" className="w-full p-0 h-auto text-blue-600 dark:text-blue-400">
                      Voir toutes les tâches ({upcomingTasks.length})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/20 via-white to-slate-50/20 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50 hover:shadow-lg transition-all duration-300 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30 border-blue-200/30 dark:border-slate-600/50">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-gray-900 dark:text-white">Activité récente</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Dernières actions sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Aucune activité récente</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-blue-50/20 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
                      <div className="p-2 bg-gray-100 dark:bg-slate-600 rounded-lg">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(activity.date, { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 