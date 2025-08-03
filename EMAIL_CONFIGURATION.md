# Configuration Email pour le Tracking

Ce document explique comment configurer les variables d'environnement pour le système de tracking d'emails.

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env.local` :

### Configuration SMTP (Envoi d'emails)

```env
# Serveur SMTP
SMTP_HOST="smtp.gmail.com"              # Serveur SMTP de votre fournisseur
SMTP_PORT="587"                         # 587 pour TLS, 465 pour SSL
SMTP_SECURE="false"                     # true pour 465, false pour 587
SMTP_USER="your-email@gmail.com"        # Votre adresse email
SMTP_PASSWORD="your-app-password"       # Mot de passe d'application
SMTP_FROM_EMAIL="your-email@gmail.com"  # Email expéditeur
SMTP_FROM_NAME="Votre Nom"              # Nom de l'expéditeur
EMAIL_DOMAIN="votre-domaine.com"        # Votre domaine pour les Message-ID
```

### Configuration IMAP (Réception d'emails)

```env
# Serveur IMAP pour écouter les réponses
IMAP_HOST="imap.gmail.com"              # Serveur IMAP
IMAP_PORT="993"                         # 993 pour SSL, 143 sinon
IMAP_SECURE="true"                      # true pour SSL
IMAP_USER="your-email@gmail.com"        # Même que SMTP_USER généralement
IMAP_PASSWORD="your-app-password"       # Même que SMTP_PASSWORD généralement
```

### Configuration Tracking

```env
# Secret pour sécuriser les liens de tracking
EMAIL_TRACKING_SECRET="votre-clé-secrète-unique"
```

## Configuration par fournisseur

### Gmail (Recommandé pour dev/test)

1. **Activez l'authentification à 2 facteurs** sur votre compte Google
2. **Générez un mot de passe d'application** : [Guide Google](https://support.google.com/accounts/answer/185833)
3. **Utilisez ces paramètres** :

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
IMAP_HOST="imap.gmail.com"
IMAP_PORT="993"
IMAP_SECURE="true"
SMTP_USER="votre-email@gmail.com"
SMTP_PASSWORD="mot-de-passe-application-16-caracteres"
IMAP_USER="votre-email@gmail.com"
IMAP_PASSWORD="mot-de-passe-application-16-caracteres"
```

### Outlook/Hotmail

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
IMAP_HOST="outlook.office365.com"
IMAP_PORT="993"
IMAP_SECURE="true"
```

### Yahoo Mail

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
IMAP_HOST="imap.mail.yahoo.com"
IMAP_PORT="993"
IMAP_SECURE="true"
```

### Serveur personnalisé

```env
SMTP_HOST="mail.votre-domaine.com"
SMTP_PORT="587"
SMTP_SECURE="false"
IMAP_HOST="mail.votre-domaine.com"
IMAP_PORT="993"
IMAP_SECURE="true"
```

## Démarrage du système

### 1. Tester la configuration

```bash
# Tester la connexion SMTP et IMAP
npm run email:test
```

### 2. Démarrer l'écoute IMAP

Le système IMAP démarre automatiquement avec l'application. Pour le contrôler manuellement :

```typescript
import { startImapListener, stopImapListener } from '@/lib/imap-listener';

// Démarrer
await startImapListener();

// Arrêter
await stopImapListener();
```

## Fonctionnalités du système

### Tracking d'ouverture

- Pixel invisible inséré automatiquement dans tous les emails HTML
- Enregistrement de : date/heure, IP, user-agent
- Notifications automatiques lors de la première ouverture

### Tracking des réponses

- Écoute IMAP en temps réel des nouveaux emails
- Analyse des headers (In-Reply-To, References, Message-ID)
- Liaison automatique avec l'email original
- Notifications automatiques des réponses

### APIs disponibles

- `GET /api/emails` - Liste des emails avec statistiques
- `POST /api/emails` - Créer et envoyer un email
- `GET /api/emails/[id]` - Détails d'un email
- `PUT /api/emails/[id]` - Modifier un brouillon
- `DELETE /api/emails/[id]` - Supprimer un brouillon
- `POST /api/emails/[id]/send` - Envoyer un brouillon
- `GET /api/track/open` - Pixel de tracking (automatique)

## Sécurité et RGPD

### Conformité RGPD

- Les données de tracking sont liées au consentement utilisateur
- Possibilité de désactiver le tracking par client
- Données minimales collectées (IP anonymisée possible)
- Droit à l'effacement respecté

### Sécurité

- Tokens de tracking sécurisés (HMAC-SHA256)
- Variables d'environnement pour les secrets
- Validation stricte des données
- Protection contre les injections

## Troubleshooting

### Erreurs courantes

1. **"Can't reach SMTP server"**

   - Vérifiez SMTP_HOST et SMTP_PORT
   - Testez avec telnet : `telnet smtp.gmail.com 587`

2. **"Authentication failed"**

   - Vérifiez SMTP_USER et SMTP_PASSWORD
   - Pour Gmail : utilisez un mot de passe d'application

3. **"IMAP connection failed"**

   - Vérifiez IMAP_HOST et IMAP_PORT
   - Activez IMAP dans les paramètres de votre email

4. **"Tracking pixel not working"**
   - Vérifiez EMAIL_TRACKING_SECRET
   - Vérifiez que NEXTAUTH_URL est correct

### Logs de débogage

Les logs sont disponibles dans la console serveur :

- Connexions IMAP
- Envois d'emails
- Erreurs de tracking
- Réponses détectées

## Support

Pour plus d'aide :

1. Vérifiez les logs de la console
2. Testez la configuration avec `npm run email:test`
3. Consultez la documentation de votre fournisseur email
