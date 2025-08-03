# Guide d'import en lot de restaurants

## Vue d'ensemble

Cette fonctionnalité vous permet d'importer des restaurants en lot comme prospects dans votre CRM. L'API vérifie automatiquement les doublons et organise les informations de manière structurée.

## Endpoint API

**POST** `/api/clients/bulk-import`

## Format des données

L'API accepte **deux formats** de données :

### Format 1: Objet avec propriété restaurants (recommandé)

```json
{
  "restaurants": [
    {
      "nom": "Nom du restaurant (requis)",
      "adresse": "Adresse complète (optionnel)",
      "telephone": "Numéro de téléphone (optionnel)",
      "email": "email@restaurant.fr (optionnel)",
      "site_web": "https://www.restaurant.fr (optionnel)",
      "type_cuisine": "Type de cuisine (optionnel)",
      "note_moyenne": 4.5,
      "nombre_avis": 123,
      "gamme_prix": "€€€ (optionnel)",
      "horaires": {
        "lundi": "12:00-14:00, 19:00-22:00",
        "mardi": "12:00-14:00, 19:00-22:00"
      },
      "services": ["Service 1", "Service 2"],
      "specialites": ["Spécialité 1", "Spécialité 2"],
      "photos": ["https://example.com/photo1.jpg"]
    }
  ],
  "createAsProspects": true
}
```

### Format 2: Tableau direct de restaurants (simplifié)

```json
[
  {
    "nom": "Nom du restaurant (requis)",
    "adresse": "Adresse complète (optionnel)",
    "telephone": "Numéro de téléphone (optionnel)",
    "email": "email@restaurant.fr (optionnel)",
    "site_web": "https://www.restaurant.fr (optionnel)",
    "type_cuisine": "Type de cuisine (optionnel)",
    "note_moyenne": 4.5,
    "nombre_avis": 123,
    "gamme_prix": "€€€ (optionnel)",
    "horaires": {
      "lundi": "12:00-14:00, 19:00-22:00",
      "mardi": "12:00-14:00, 19:00-22:00"
    },
    "services": ["Service 1", "Service 2"],
    "specialites": ["Spécialité 1", "Spécialité 2"],
    "photos": ["https://example.com/photo1.jpg"]
  }
]
```

**Note**: Le Format 2 créera automatiquement tous les clients comme prospects.

## Fonctionnalités

### Détection des doublons

L'API évite automatiquement les doublons en vérifiant :

1. **Email identique** : Si un client existe avec le même email
2. **Nom + Adresse identiques** : Si un client existe avec le même nom et la même adresse

### Enrichissement des données

Les informations supplémentaires (type de cuisine, note, services, etc.) sont automatiquement ajoutées dans les notes du client.

### Statut des prospects

Les nouveaux clients sont créés avec le statut `PROSPECT` par défaut.

## Utilisation

### 1. Via script Node.js (recommandé pour test)

```bash
node scripts/test-bulk-import.js
```

### 2. Via cURL

**Format 1 (avec objet):**

```bash
curl -X POST http://localhost:3000/api/clients/bulk-import \
  -H "Content-Type: application/json" \
  -d @example-restaurants-import.json
```

**Format 2 (tableau direct):**

```bash
curl -X POST http://localhost:3000/api/clients/bulk-import \
  -H "Content-Type: application/json" \
  -d @test-direct-array.json
```

### 3. Via votre application frontend

```javascript
const response = await fetch('/api/clients/bulk-import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    restaurants: restaurantsData,
    createAsProspects: true
  })
});

const result = await response.json();
console.log('Import results:', result);
```

## Réponse de l'API

```json
{
  "success": true,
  "message": "Import terminé: 3 clients créés, 1 ignoré, 0 erreurs",
  "result": {
    "created": 3,
    "skipped": 1,
    "errors": 0,
    "details": [
      {
        "name": "Restaurant Le Gourmet",
        "status": "created",
        "clientId": "cuid_generated_id"
      },
      {
        "name": "Restaurant Existant",
        "status": "skipped",
        "reason": "Client existant (même email)"
      }
    ]
  }
}
```

## Authentification

Cette API fonctionne **sans authentification**. Elle crée automatiquement un utilisateur système pour gérer les imports en lot. Tous les clients importés seront associés à cet utilisateur système.

## Validation des données

- **nom** : Requis, chaîne non vide
- **email** : Optionnel, doit être un email valide si fourni
- **site_web** : Optionnel, doit être une URL valide si fournie
- **note_moyenne** : Optionnel, doit être un nombre
- **nombre_avis** : Optionnel, doit être un nombre
- **horaires** : Optionnel, objet avec clés/valeurs en chaînes
- **services** : Optionnel, tableau de chaînes
- **specialites** : Optionnel, tableau de chaînes
- **photos** : Optionnel, tableau de chaînes (URLs)

## Gestion des erreurs

En cas d'erreur, l'API retourne :

```json
{
  "error": "Description de l'erreur",
  "details": [
    {
      "path": "restaurants.0.email",
      "message": "Email invalide"
    }
  ]
}
```

## Conseils d'utilisation

1. **Testez d'abord** avec un petit échantillon de données
2. **Vérifiez les doublons** en examinant les résultats retournés
3. **Organisez vos données** selon le format JSON attendu
4. **Sauvegardez** vos données originales avant l'import
5. **Utilisez des emails valides** pour faciliter la détection des doublons

## Exemple complet

Un fichier d'exemple `example-restaurants-import.json` est fourni avec 5 restaurants d'exemple pour tester la fonctionnalité.
