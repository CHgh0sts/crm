# 🤖 Système d'Automatisation Côté Serveur

Ce système permet d'exécuter les automatisations **même quand vous n'êtes pas connecté** au site web. Il fonctionne indépendamment du navigateur, directement sur le serveur.

## 🚀 Démarrage Rapide

### 1. Test Manuel

```bash
# Test unique
npm run scheduler

# Mode continu (pour développement)
npm run scheduler:continuous
```

### 2. Configuration Automatique avec Cron

#### Sur Linux/Mac (Recommandé)

```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne pour exécuter toutes les 30 secondes (via script continu)
* * * * * cd /chemin/vers/votre/projet && npm run scheduler:continuous >> /var/log/automation.log 2>&1

# Ou toutes les 5 minutes
*/5 * * * * cd /chemin/vers/votre/projet && npm run scheduler >> /var/log/automation.log 2>&1
```

#### Sur Windows

```powershell
# Créer une tâche planifiée Windows
schtasks /create /sc minute /mo 1 /tn "CRM-Automation" /tr "cmd /c cd C:\chemin\vers\projet && npm run scheduler"
```

## 📋 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` ou modifiez votre configuration :

```env
# URL de votre application (obligatoire pour la production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# En production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### Logs

Les logs sont affichés avec des couleurs et timestamps :

```
[2024-01-15T10:30:00.000Z] ℹ️  Démarrage du vérificateur d'automatisations...
[2024-01-15T10:30:01.123Z] ✅ 2 automatisation(s) exécutée(s)
[2024-01-15T10:30:01.124Z] ✅ "Rappel emails clients" - Prochaine exécution: 2024-01-15T10:35:00.000Z
[2024-01-15T10:30:01.125Z] ❌ "Backup quotidien" - Erreur: Service indisponible
```

## 🛠️ Modes d'Utilisation

### Mode Une Fois (Cron)

```bash
npm run scheduler
```

- ✅ Exécute une seule vérification
- ✅ Se ferme automatiquement
- ✅ Parfait pour cron jobs
- ✅ Code de sortie 0 = succès, 1 = erreur

### Mode Continu (Développement)

```bash
npm run scheduler:continuous
```

- ✅ Boucle infinie, vérification toutes les 30 secondes
- ✅ Idéal pour développement/test
- ⚠️ Utilise plus de ressources
- 🛑 Ctrl+C pour arrêter

## 📅 Configuration Cron Avancée

### Exemples de Fréquences

```bash
# Toutes les minutes
* * * * * cd /projet && npm run scheduler

# Toutes les 5 minutes
*/5 * * * * cd /projet && npm run scheduler

# Toutes les heures à la minute 0
0 * * * * cd /projet && npm run scheduler

# Tous les jours à 9h00
0 9 * * * cd /projet && npm run scheduler

# Du lundi au vendredi à 9h00
0 9 * * 1-5 cd /projet && npm run scheduler
```

### Script Cron Complet avec Logs

```bash
#!/bin/bash
# Fichier: ~/cron-automation.sh

# Configuration
PROJECT_DIR="/chemin/vers/votre/projet"
LOG_FILE="/var/log/crm-automation.log"
ERROR_LOG="/var/log/crm-automation-error.log"

# Changer vers le répertoire du projet
cd "$PROJECT_DIR"

# Exécuter le scheduler avec logs détaillés
echo "=== $(date) ===" >> "$LOG_FILE"
npm run scheduler >> "$LOG_FILE" 2>> "$ERROR_LOG"

# Nettoyer les anciens logs (garder 7 jours)
find /var/log -name "crm-automation*.log" -mtime +7 -delete
```

Puis dans crontab :

```bash
*/5 * * * * /bin/bash ~/cron-automation.sh
```

## 🔧 Dépannage

### Problème : "Impossible de se connecter au serveur"

```bash
# Vérifier que l'application est démarrée
curl http://localhost:3000/api/automations/scheduler

# Vérifier les processus
ps aux | grep node

# Vérifier les ports
netstat -tulpn | grep 3000
```

### Problème : Cron ne fonctionne pas

```bash
# Vérifier le service cron
sudo systemctl status cron

# Voir les logs cron
sudo tail -f /var/log/cron

# Tester la commande manuellement
cd /votre/projet && npm run scheduler
```

### Problème : Permissions

```bash
# Donner les permissions d'exécution
chmod +x scripts/automation-scheduler.js

# Vérifier les permissions du répertoire
ls -la /votre/projet/
```

## 📊 Monitoring

### Logs en Temps Réel

```bash
# Voir les logs en direct
tail -f /var/log/automation.log

# Filtrer les erreurs seulement
tail -f /var/log/automation.log | grep "❌"

# Filtrer les succès seulement
tail -f /var/log/automation.log | grep "✅"
```

### Statistiques

```bash
# Compter les exécutions du jour
grep "$(date +%Y-%m-%d)" /var/log/automation.log | grep "automatisation(s) exécutée(s)" | wc -l

# Voir les erreurs récentes
grep "❌" /var/log/automation.log | tail -10
```

## 🎯 Avantages de ce Système

- ✅ **Indépendant du navigateur** : Fonctionne même si vous fermez le site
- ✅ **Fiable** : Utilise le système cron du serveur
- ✅ **Économe** : Consomme peu de ressources
- ✅ **Logs détaillés** : Suivi complet des exécutions
- ✅ **Gestion d'erreurs** : Continue même en cas de problème
- ✅ **Flexible** : Multiple modes d'exécution
- ✅ **Production-ready** : Adapté aux environnements de production

## 🚨 Important

1. **Assurez-vous que votre application Next.js est toujours démarrée** (avec `npm start` ou PM2)
2. **Configurez les logs en rotation** pour éviter qu'ils prennent trop d'espace
3. **Testez d'abord manuellement** avant de configurer cron
4. **Surveillez les logs** régulièrement pour détecter les problèmes

---

🎉 **Avec ce système, vos automatisations fonctionnent 24h/24, 7j/7 !**
