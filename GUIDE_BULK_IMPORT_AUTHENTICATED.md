# Guide d'import en lot de clients avec authentification

## Route API : `/api/clients/bulk-import`

Cette route permet d'importer en lot des données de restaurants/entreprises comme prospects dans votre CRM, en associant les clients à l'utilisateur connecté.

## Authentification requise

🔐 **Cette route nécessite maintenant une authentification** via :

- **Token Bearer** dans le header `Authorization`
- **Cookie de session** (pour les appels depuis l'interface web)

### Exemple avec Token Bearer

```bash
curl -X POST http://localhost:3000/api/clients/bulk-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @data.json
```

### Obtenir un token JWT

1. **Connexion via API** :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

2. **Récupérer le token** dans la réponse ou le cookie `auth-token`

## Formats de données supportés

La route accepte 3 formats de données :

### Format 1 : Objet avec propriété `restaurants`

```json
{
  "restaurants": [
    {
      "title": "Restaurant ABC",
      "address": "123 Rue Example",
      "phone": "+33123456789",
      "email": "contact@restaurant-abc.com",
      "website": "https://restaurant-abc.com",
      "cuisineType": "Française",
      "rating": 4.5,
      "reviewCount": 120,
      "priceRange": "€€",
      "openingHours": [
        { "day": "Lundi", "hours": "12:00-14:00, 19:00-22:00" },
        { "day": "Mardi", "hours": "12:00-14:00, 19:00-22:00" }
      ],
      "specialties": ["Coq au vin", "Ratatouille"],
      "services": ["Terrasse", "Livraison"]
    }
  ],
  "createAsProspects": true
}
```

### Format 2 : Tableau direct

```json
[
  {
    "title": "Restaurant XYZ",
    "address": "456 Avenue Test",
    "phone": "+33987654321",
    "email": "info@restaurant-xyz.com"
  }
]
```

### Format 3 : Objet avec propriété `body`

```json
{
  "body": [
    {
      "title": "Restaurant DEF",
      "address": "789 Boulevard Demo",
      "phone": "+33555666777",
      "email": "hello@restaurant-def.com"
    }
  ]
}
```

## Champs supportés

| Champ          | Type   | Requis | Description                  |
| -------------- | ------ | ------ | ---------------------------- |
| `title`        | string | ✅     | Nom du restaurant/entreprise |
| `address`      | string | ❌     | Adresse complète             |
| `phone`        | string | ❌     | Numéro de téléphone          |
| `email`        | string | ❌     | Email de contact             |
| `website`      | string | ❌     | Site web (URL valide)        |
| `cuisineType`  | string | ❌     | Type de cuisine              |
| `rating`       | number | ❌     | Note moyenne                 |
| `reviewCount`  | number | ❌     | Nombre d'avis                |
| `priceRange`   | string | ❌     | Gamme de prix                |
| `openingHours` | array  | ❌     | Horaires d'ouverture         |
| `specialties`  | array  | ❌     | Spécialités                  |
| `services`     | array  | ❌     | Services proposés            |

## Réponse de l'API

### Succès (201)

```json
{
  "success": true,
  "message": "Import terminé: 5 clients créés, 2 ignorés, 0 erreurs",
  "result": {
    "created": 5,
    "skipped": 2,
    "errors": 0,
    "details": [
      {
        "name": "Restaurant ABC",
        "status": "created",
        "clientId": "cm2xyz123"
      },
      {
        "name": "Restaurant DEF",
        "status": "skipped",
        "reason": "Client existant (même email)"
      }
    ]
  }
}
```

### Erreur d'authentification (401)

```json
{
  "error": "Non authentifié. Token Bearer requis."
}
```

### Erreur de validation (400)

```json
{
  "error": "Données invalides",
  "details": [
    {
      "path": "body.0.title",
      "message": "Le titre est requis"
    }
  ]
}
```

## Gestion des doublons

La route vérifie automatiquement les doublons pour **l'utilisateur connecté** :

1. **Par email** : Si un client avec le même email existe déjà
2. **Par nom + adresse** : Si un client avec les même nom et adresse existe déjà

Les doublons sont **ignorés** et comptés dans `result.skipped`.

## Statut des clients

Tous les clients importés sont créés avec le statut **PROSPECT** par défaut.

## Sécurité

- ✅ Authentification obligatoire
- ✅ Isolation par utilisateur (chaque utilisateur voit uniquement ses clients)
- ✅ Validation des données avec Zod
- ✅ Gestion des erreurs sécurisée

## Exemple complet avec Node.js

```javascript
const fs = require('fs');

async function importRestaurants() {
  // 1. Se connecter pour obtenir un token
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'votre-email@example.com',
      password: 'votre-mot-de-passe'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token; // ou récupérer depuis les cookies

  // 2. Importer les données
  const data = JSON.parse(fs.readFileSync('restaurants.json', 'utf8'));

  const importResponse = await fetch('http://localhost:3000/api/clients/bulk-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ body: data })
  });

  const result = await importResponse.json();
  console.log('Import terminé:', result);
}

importRestaurants().catch(console.error);
```

## Limitations

- Maximum **1000 clients** par requête (recommandé)
- Champs supplémentaires ignorés (grâce à `.passthrough()`)
- Les horaires d'ouverture sont stockées comme texte dans les notes
