// Script de test pour l'import en lot de restaurants avec authentification
// Usage: node scripts/test-bulk-import-auth.js email@example.com password

const restaurantsData = [
  {
    "title": "Restaurant Le Gourmet",
    "address": "123 Rue de la Paix, 75001 Paris",
    "phone": "+33 1 42 86 87 88",
    "email": "contact@legourmet.fr",
    "website": "https://www.legourmet.fr",
    "cuisineType": "Française",
    "rating": 4.5,
    "reviewCount": 127,
    "priceRange": "€€€",
    "openingHours": [
      { "day": "Lundi", "hours": "12:00-14:00, 19:00-22:00" },
      { "day": "Mardi", "hours": "12:00-14:00, 19:00-22:00" },
      { "day": "Mercredi", "hours": "12:00-14:00, 19:00-22:00" },
      { "day": "Jeudi", "hours": "12:00-14:00, 19:00-22:00" },
      { "day": "Vendredi", "hours": "12:00-14:00, 19:00-23:00" },
      { "day": "Samedi", "hours": "12:00-14:00, 19:00-23:00" },
      { "day": "Dimanche", "hours": "Fermé" }
    ],
    "services": ["Terrasse", "Réservation", "Livraison"],
    "specialties": ["Bouillabaisse", "Coq au vin", "Soufflé au chocolat"]
  },
  {
    "title": "Pizzeria Bella Vista",
    "address": "45 Avenue des Champs-Élysées, 75008 Paris",
    "phone": "+33 1 53 75 78 79",
    "email": "info@bellavista.fr",
    "website": "https://www.bellavista.fr",
    "cuisineType": "Italienne",
    "rating": 4.2,
    "reviewCount": 89,
    "priceRange": "€€",
    "openingHours": [
      { "day": "Lundi", "hours": "11:30-23:00" },
      { "day": "Mardi", "hours": "11:30-23:00" },
      { "day": "Mercredi", "hours": "11:30-23:00" },
      { "day": "Jeudi", "hours": "11:30-23:00" },
      { "day": "Vendredi", "hours": "11:30-00:00" },
      { "day": "Samedi", "hours": "11:30-00:00" },
      { "day": "Dimanche", "hours": "11:30-23:00" }
    ],
    "services": ["Emporter", "Livraison", "Groupes"],
    "specialties": ["Pizza Margherita", "Risotto aux champignons", "Tiramisu"]
  },
  {
    "title": "Sushi Tokyo",
    "address": "78 Boulevard Saint-Germain, 75005 Paris",
    "phone": "+33 1 46 33 21 20",
    "email": "reservation@sushitokyo.fr",
    "website": "https://www.sushitokyo.fr",
    "cuisineType": "Japonaise",
    "rating": 4.7,
    "reviewCount": 203,
    "priceRange": "€€€€",
    "openingHours": [
      { "day": "Lundi", "hours": "18:00-22:30" },
      { "day": "Mardi", "hours": "12:00-14:30, 18:00-22:30" },
      { "day": "Mercredi", "hours": "12:00-14:30, 18:00-22:30" },
      { "day": "Jeudi", "hours": "12:00-14:30, 18:00-22:30" },
      { "day": "Vendredi", "hours": "12:00-14:30, 18:00-23:00" },
      { "day": "Samedi", "hours": "12:00-14:30, 18:00-23:00" },
      { "day": "Dimanche", "hours": "18:00-22:30" }
    ],
    "services": ["Omakase", "Réservation obligatoire", "Bar à sushis"],
    "specialties": ["Sashimi de thon", "Maki dragon", "Mochi glacé"]
  }
];

async function login(email, password) {
  console.log('🔐 Connexion en cours...');
  
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erreur de connexion: ${result.error || result.message}`);
  }

  // Récupérer le token du cookie ou de la réponse
  const cookieHeader = response.headers.get('set-cookie');
  let token = null;
  
  if (cookieHeader) {
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }
  }
  
  // Si pas de token dans les cookies, essayer la réponse
  if (!token && result.token) {
    token = result.token;
  }

  if (!token) {
    throw new Error('Aucun token d\'authentification reçu');
  }

  console.log('✅ Connexion réussie');
  return token;
}

async function testBulkImportWithAuth(email, password, format = 'body') {
  try {
    console.log('🚀 Test d\'import en lot de restaurants avec authentification\n');
    
    // 1. Se connecter
    const token = await login(email, password);
    
    // 2. Préparer les données selon le format choisi
    let payload;
    switch (format) {
      case 'restaurants':
        payload = {
          restaurants: restaurantsData,
          createAsProspects: true
        };
        break;
      case 'direct':
        payload = restaurantsData;
        break;
      case 'body':
      default:
        payload = {
          body: restaurantsData
        };
        break;
    }
    
    console.log(`📤 Envoi des données (format: ${format})...`);
    
    // 3. Importer les données
    const response = await fetch('http://localhost:3000/api/clients/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Import réussi !');
      console.log(`📊 Résultats: ${result.result.created} créés, ${result.result.skipped} ignorés, ${result.result.errors} erreurs\n`);
      
      console.log('📋 Détails:');
      result.result.details.forEach((detail, index) => {
        const emoji = detail.status === 'created' ? '✅' : detail.status === 'skipped' ? '⏭️' : '❌';
        console.log(`${emoji} ${detail.name}: ${detail.status}${detail.reason ? ` - ${detail.reason}` : ''}`);
        if (detail.clientId) {
          console.log(`   ID: ${detail.clientId}`);
        }
      });
    } else {
      console.error('❌ Erreur lors de l\'import:', result.error);
      if (result.details) {
        console.error('Détails:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function testAllFormats(email, password) {
  console.log('🧪 Test de tous les formats supportés\n');
  
  const formats = ['body', 'restaurants', 'direct'];
  
  for (const format of formats) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Format: ${format.toUpperCase()}`);
    console.log('='.repeat(50));
    
    await testBulkImportWithAuth(email, password, format);
    
    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Usage en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/test-bulk-import-auth.js <email> <password> [format]');
    console.log('Formats disponibles: body (défaut), restaurants, direct, all');
    process.exit(1);
  }
  
  const [email, password, format = 'body'] = args;
  
  if (format === 'all') {
    testAllFormats(email, password);
  } else {
    testBulkImportWithAuth(email, password, format);
  }
}

module.exports = { testBulkImportWithAuth, testAllFormats, restaurantsData };