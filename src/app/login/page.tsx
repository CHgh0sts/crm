'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/components/providers/auth-provider'
import { Eye, EyeOff, ArrowRight, Shield, Clock, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (error) {
      setError('Email ou mot de passe incorrect')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Aura bleue pour la section gauche */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/8 via-blue-500/3 to-transparent dark:from-blue-400/10 dark:via-blue-400/5 dark:to-transparent" />
        
        <div className="flex flex-col justify-center px-12 relative z-10">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-500/30 shadow-lg">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">Focalis</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Bienvenue sur votre CRM
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Gérez vos projets, clients et factures en toute simplicité
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-700/60 dark:via-slate-800/60 dark:to-slate-700/60 border border-blue-200/30 dark:border-slate-600/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <div className="p-2 bg-blue-600 rounded-lg shadow-blue-500/30 shadow-lg relative z-10">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sécurisé</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vos données sont protégées</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-700/60 dark:via-slate-800/60 dark:to-slate-700/60 border border-blue-200/30 dark:border-slate-600/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <div className="p-2 bg-blue-600 rounded-lg shadow-blue-500/30 shadow-lg relative z-10">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Suivi temps réel</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trackez votre temps facilement</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-slate-700/60 dark:via-slate-800/60 dark:to-slate-700/60 border border-blue-200/30 dark:border-slate-600/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <div className="p-2 bg-blue-600 rounded-lg shadow-blue-500/30 shadow-lg relative z-10">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gestion client</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Centralisez vos relations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 relative">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center space-x-3 mb-8 lg:hidden">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-500/30 shadow-lg">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">Focalis</span>
          </div>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50">
            {/* Aura bleue pour la carte */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Connexion</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Connectez-vous à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-blue-200/50 dark:border-slate-600 focus:border-blue-500 pr-10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 