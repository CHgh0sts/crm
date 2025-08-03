# Focalis

**Focalis** est une plateforme SaaS complète conçue spécialement pour les freelances et consultants indépendants. Gérez efficacement vos clients, projets, tâches, factures et templates en un seul endroit.

## 🚀 Fonctionnalités

- **Gestion des clients** : Organisez vos contacts et informations clients
- **Suivi des projets** : Planifiez et suivez l'avancement de vos projets
- **Gestion des tâches** : Créez et organisez vos tâches avec priorités
- **Système de facturation** : Créez des factures professionnelles avec des templates personnalisables
- **Builder de templates** : Créez vos propres templates de facture avec un éditeur drag & drop
- **Suivi du temps** : Enregistrez le temps passé sur vos projets
- **Dashboard analytics** : Visualisez vos performances et statistiques
- **🤖 Système d'automatisation** : Automatisez vos tâches récurrentes (emails, rappels, rapports)
  - Planification avancée (quotidien, hebdomadaire, mensuel, etc.)
  - Exécution côté serveur (fonctionne même hors ligne)
  - 12 types d'automatisation disponibles

## 🛠️ Technologies

- **Frontend** : Next.js 15, React, TypeScript
- **Styling** : Tailwind CSS, Radix UI
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : NextAuth.js
- **Drag & Drop** : dnd-kit
- **Génération PDF** : jsPDF, html2canvas

## 🚦 Installation

1. Clonez le repository :

```bash
git clone https://github.com/votre-nom/focalis.git
cd focalis
```

2. Installez les dépendances :

```bash
npm install
```

3. Configurez la base de données :

```bash
# Copiez le fichier d'environnement
cp .env.example .env.local

# Configurez vos variables d'environnement dans .env.local
# DATABASE_URL="votre-url-postgresql"
# NEXTAUTH_SECRET="votre-secret"
# NEXTAUTH_URL="http://localhost:3000"

# Lancez les migrations Prisma
npx prisma migrate dev
npx prisma generate
```

4. Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
focalis/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   ├── components/          # Composants React réutilisables
│   ├── hooks/              # Hooks React personnalisés
│   ├── lib/                # Utilitaires et configurations
│   └── generated/          # Fichiers générés
├── prisma/                 # Schéma et migrations de base de données
└── public/                 # Assets statiques
```

## 🎨 Templates de facture

Focalis inclut un système de templates de facture avec :

- Builder drag & drop intuitif
- Templates préconçus (Classique, Moderne, Minimaliste)
- Personnalisation complète des styles
- Variables dynamiques pour les données client/facture
- Export PDF haute qualité

## 🤖 Système d'Automatisation

Focalis inclut un puissant système d'automatisation qui fonctionne **24h/24, 7j/7**, même quand vous n'êtes pas connecté au site.

### Démarrage rapide

```bash
# Test manuel
npm run scheduler

# Mode continu (développement)
npm run scheduler:continuous

# Daemon en arrière-plan
./scripts/start-scheduler-daemon.sh start
./scripts/start-scheduler-daemon.sh status
./scripts/start-scheduler-daemon.sh stop
```

### Types d'automatisation disponibles

- 📧 **Rappels par email** - Envoi automatique de rappels
- ✅ **Création de tâches** - Génération automatique de tâches
- 🔄 **Mise à jour de statuts** - Changement automatique de statuts
- 📊 **Génération de rapports** - Rapports automatiques
- 👥 **Suivi client** - Relance automatique des clients
- 💰 **Rappels de facture** - Rappels de paiement automatiques
- 💾 **Sauvegarde de données** - Backup automatique
- 🔔 **Envoi de notifications** - Alertes personnalisées
- 📁 **Archivage de projets** - Archivage automatique
- 🔍 **Vérification client** - Contrôles périodiques
- ⏰ **Alertes d'échéances** - Rappels avant deadline
- 📋 **Résumé hebdomadaire** - Rapports de synthèse

### Configuration production avec cron

```bash
# Éditer crontab
crontab -e

# Exécuter toutes les 5 minutes
*/5 * * * * cd /chemin/vers/projet && npm run scheduler >> /var/log/automation.log 2>&1
```

📖 **Documentation complète** : [AUTOMATION_SCHEDULER.md](AUTOMATION_SCHEDULER.md)

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

---

**Focalis** - Donnez de la clarté à votre activité freelance.
# crm
