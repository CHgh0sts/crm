# Scripts de Migration des Clients

Ce dossier contient plusieurs scripts pour migrer la propriété des clients vers un utilisateur spécifique.

## 🎯 Objectif

Migrer tous les clients vers l'utilisateur avec l'ID : `cmdw4dt4i002tnx0ktyeby281`

## 📋 Scripts disponibles

### 1. `safe-migrate-clients.js` ⭐ **RECOMMANDÉ**

Script principal qui effectue une migration sécurisée avec sauvegarde automatique.

```bash
# Migration avec confirmation interactive
node scripts/safe-migrate-clients.js

# Migration directe sans confirmation
node scripts/safe-migrate-clients.js --force

# Aide
node scripts/safe-migrate-clients.js --help
```

**Fonctionnalités :**

- ✅ Sauvegarde automatique avant migration
- ✅ Affichage de l'état avant/après
- ✅ Confirmation interactive
- ✅ Instructions de rollback
- ✅ Gestion d'erreurs robuste

### 2. `migrate-clients-to-user.js`

Script de migration basique sans sauvegarde.

```bash
# Effectuer la migration
node scripts/migrate-clients-to-user.js

# Voir la distribution actuelle
node scripts/migrate-clients-to-user.js --status

# Aide
node scripts/migrate-clients-to-user.js --help
```

### 3. `backup-clients-ownership.js`

Script de gestion des sauvegardes.

```bash
# Créer une sauvegarde
node scripts/backup-clients-ownership.js

# Lister les sauvegardes existantes
node scripts/backup-clients-ownership.js --list

# Restaurer depuis une sauvegarde
node scripts/backup-clients-ownership.js --restore <fichier>

# Aide
node scripts/backup-clients-ownership.js --help
```

## 🚀 Procédure recommandée

### Étape 1 : Vérifier l'état actuel

```bash
node scripts/migrate-clients-to-user.js --status
```

### Étape 2 : Migration sécurisée

```bash
node scripts/safe-migrate-clients.js
```

### Étape 3 : Vérifier le résultat

La distribution finale sera affichée automatiquement.

## 🔄 En cas de problème

### Rollback (annuler la migration)

1. **Lister les sauvegardes disponibles :**

   ```bash
   node scripts/backup-clients-ownership.js --list
   ```

2. **Restaurer depuis la sauvegarde :**
   ```bash
   node scripts/backup-clients-ownership.js --restore backups/clients-backup-XXXX.json
   ```

### Exemple de rollback complet

```bash
# Voir les sauvegardes
node scripts/backup-clients-ownership.js --list

# Restaurer (remplacer par le bon nom de fichier)
node scripts/backup-clients-ownership.js --restore backups/clients-backup-2024-01-15T10-30-00-000Z.json

# Vérifier que tout est revenu à l'état initial
node scripts/migrate-clients-to-user.js --status
```

## 📁 Structure des sauvegardes

Les sauvegardes sont stockées dans le dossier `backups/` avec la structure :

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalClients": 150,
  "statistics": {
    "userCount": 3,
    "distribution": {
      "user1": { "userEmail": "user1@example.com", "count": 100 },
      "user2": { "userEmail": "user2@example.com", "count": 50 }
    }
  },
  "clients": [
    {
      "clientId": "client_123",
      "clientName": "Entreprise ABC",
      "clientEmail": "contact@abc.com",
      "userId": "user_456",
      "userEmail": "owner@example.com",
      "userName": "John Doe"
    }
  ]
}
```

## ⚠️ Points importants

### Avant la migration

- ✅ Assurez-vous que l'utilisateur cible existe
- ✅ Vérifiez la distribution actuelle
- ✅ Créez une sauvegarde (automatique avec `safe-migrate-clients.js`)

### Pendant la migration

- ⏳ Ne pas interrompre le processus
- 📊 Observer les logs pour détecter d'éventuelles erreurs

### Après la migration

- ✅ Vérifier que tous les clients appartiennent au bon utilisateur
- ✅ Tester l'accès aux clients depuis l'interface
- 🗃️ Conserver la sauvegarde pour un éventuel rollback

## 🔍 Dépannage

### Erreur "Utilisateur non trouvé"

```
❌ Utilisateur avec l'ID cmdw4dt4i002tnx0ktyeby281 non trouvé
```

**Solution :** Vérifier que l'ID utilisateur est correct dans la base de données.

### Erreur de permissions Prisma

```
❌ Erreur de connexion à la base de données
```

**Solution :** Vérifier que la variable `DATABASE_URL` est correcte dans `.env`.

### Clients déjà migrés

```
✅ Aucun client à migrer. Tous les clients appartiennent déjà à cet utilisateur.
```

**Solution :** La migration a déjà été effectuée, aucune action nécessaire.

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs d'erreur
2. Utilisez `--status` pour voir l'état actuel
3. En cas de doute, restaurez depuis une sauvegarde
4. Contactez l'équipe technique si nécessaire

## 🔒 Sécurité

- Les scripts créent automatiquement des sauvegardes
- Aucune donnée client n'est supprimée, seule la propriété change
- Les sauvegardes contiennent toutes les informations nécessaires au rollback
- Confirmation interactive pour éviter les migrations accidentelles
