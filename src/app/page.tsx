'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  BarChart3, 
  Users, 
  FileText,
  Star,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const features = [
  {
    title: "Gestion des clients",
    description: "Centralisez toutes vos informations clients et contacts en un seul endroit.",
    icon: Users,
  },
  {
    title: "Suivi du temps",
    description: "Trackez précisément le temps passé sur chaque projet avec nos outils intégrés.",
    icon: Clock,
  },
  {
    title: "Facturation automatique",
    description: "Générez automatiquement vos factures basées sur le temps travaillé.",
    icon: CreditCard,
  },
]

const testimonials = [
  {
    name: "Marie Dubois",
    role: "Designer Freelance",
    content: "Focalis a révolutionné ma façon de gérer mes projets. Je gagne 2h par jour !",
  },
  {
    name: "Thomas Martin",
    role: "Développeur Web",
    content: "La facturation automatique est un game-changer. Plus de temps perdu !",
  },
  {
    name: "Sophie Laurent",
    role: "Consultante Marketing",
    content: "Interface intuitive et fonctionnalités complètes. Je recommande vivement.",
  },
]

const faqs = [
  {
    question: "Est-ce que Focalis est gratuit ?",
    answer: "Oui, Focalis propose un plan gratuit avec les fonctionnalités essentielles pour démarrer."
  },
  {
    question: "Puis-je importer mes données existantes ?",
    answer: "Absolument ! Nous proposons des outils d'import pour faciliter votre migration."
  },
  {
    question: "Y a-t-il un support client ?",
    answer: "Oui, notre équipe support est disponible par email et chat 24/7."
  }
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-blue-200/50 dark:border-slate-700 bg-gradient-to-r from-blue-50/60 via-white to-blue-50/30 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative overflow-hidden">
        {/* Aura bleue réduite pour le header */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Focalis
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Fonctionnalités</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Témoignages</a>
              <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-slate-700/60">
                  Se connecter
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-blue-500/2 to-transparent dark:from-blue-400/8 dark:via-blue-400/3 dark:to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700">
                🚀 Nouveau : Automatisations avancées
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                Le CRM pensé pour les{' '}
                <span className="text-blue-600">freelances</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Gérez vos clients, projets et factures en toute simplicité. 
                Focalis vous fait gagner du temps pour vous concentrer sur l'essentiel.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-blue-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30 dark:from-slate-800/60 dark:via-slate-700/60 dark:to-slate-800/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Freelances actifs</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">2M+</div>
              <div className="text-gray-600 dark:text-gray-400">Heures trackées</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">500K+</div>
              <div className="text-gray-600 dark:text-gray-400">Factures générées</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">99.9%</div>
              <div className="text-gray-600 dark:text-gray-400">Uptime garanti</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Des outils puissants et intuitifs pour optimiser votre activité freelance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-blue-200/50 dark:border-slate-600 shadow-lg shadow-blue-500/10 dark:shadow-slate-900/50 hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-slate-900/70 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent dark:from-blue-400/8 dark:via-transparent dark:to-transparent" />
                  <CardHeader className="relative z-10">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-500/30 shadow-lg mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30 dark:from-slate-800/60 dark:via-slate-700/60 dark:to-slate-800/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Ils nous font confiance
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 italic text-gray-700 dark:text-gray-300">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Questions fréquentes
            </h2>
          </div>
          
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-slate-800/40 dark:via-slate-700/40 dark:to-slate-800/40 border-blue-200/30 dark:border-slate-600/50 shadow-md shadow-blue-500/5 dark:shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
                <CardHeader 
                  className="cursor-pointer relative z-10"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{faq.question}</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform text-gray-600 dark:text-gray-400 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
                {openFaq === index && (
                  <CardContent className="pt-0 relative z-10">
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-purple-600/10 dark:from-blue-600/20 dark:via-blue-500/10 dark:to-purple-600/20">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              Prêt à transformer votre activité ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Rejoignez plus de 10 000 freelances qui utilisent déjà Focalis pour optimiser leur business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 shadow-lg hover:shadow-blue-500/40 hover:shadow-xl transition-all duration-300">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-blue-200/50 dark:border-slate-700 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30 dark:from-slate-800/60 dark:via-slate-700/60 dark:to-slate-800/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/2 via-transparent to-transparent dark:from-blue-400/4 dark:via-transparent dark:to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-500/30 shadow-lg">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Focalis</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Le CRM nouvelle génération pour les freelances modernes.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Produit</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Fonctionnalités</div>
                <div>Tarifs</div>
                <div>API</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Support</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Centre d'aide</div>
                <div>Contact</div>
                <div>Documentation</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Légal</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>Confidentialité</div>
                <div>Conditions</div>
                <div>Mentions légales</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-200/30 dark:border-slate-700 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2024 Focalis. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
