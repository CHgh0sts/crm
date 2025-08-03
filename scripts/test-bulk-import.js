// Script de test pour l'import en lot de restaurants
// Usage: node scripts/test-bulk-import.js

const restaurantsData = [
  {
    "nom": "Restaurant Le Gourmet",
    "adresse": "123 Rue de la Paix, 75001 Paris",
    "telephone": "+33 1 42 86 87 88",
    "email": "contact@legourmet.fr",
    "site_web": "https://www.legourmet.fr",
    "type_cuisine": "Française",
    "note_moyenne": 4.5,
    "nombre_avis": 127,
    "gamme_prix": "€€€",
    "horaires": {
      "lundi": "12:00-14:00, 19:00-22:00",
      "mardi": "12:00-14:00, 19:00-22:00",
      "mercredi": "12:00-14:00, 19:00-22:00",
      "jeudi": "12:00-14:00, 19:00-22:00",
      "vendredi": "12:00-14:00, 19:00-23:00",
      "samedi": "12:00-14:00, 19:00-23:00",
      "dimanche": "Fermé"
    },
    "services": ["Terrasse", "Réservation", "Livraison"],
    "specialites": ["Bouillabaisse", "Coq au vin", "Soufflé au chocolat"],
    "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
  },
  {
    "nom": "Pizzeria Bella Vista",
    "adresse": "45 Avenue des Champs-Élysées, 75008 Paris",
    "telephone": "+33 1 53 75 78 79",
    "email": "info@bellavista.fr",
    "site_web": "https://www.bellavista.fr",
    "type_cuisine": "Italienne",
    "note_moyenne": 4.2,
    "nombre_avis": 89,
    "gamme_prix": "€€",
    "horaires": {
      "lundi": "11:30-23:00",
      "mardi": "11:30-23:00",
      "mercredi": "11:30-23:00",
      "jeudi": "11:30-23:00",
      "vendredi": "11:30-00:00",
      "samedi": "11:30-00:00",
      "dimanche": "11:30-23:00"
    },
    "services": ["Emporter", "Livraison", "Groupes"],
    "specialites": ["Pizza Margherita", "Risotto aux champignons", "Tiramisu"],
    "photos": ["https://example.com/pizza1.jpg"]
  },
  {
    "nom": "Sushi Tokyo",
    "adresse": "78 Boulevard Saint-Germain, 75005 Paris",
    "telephone": "+33 1 46 33 21 20",
    "email": "reservation@sushitokyo.fr",
    "site_web": "https://www.sushitokyo.fr",
    "type_cuisine": "Japonaise",
    "note_moyenne": 4.7,
    "nombre_avis": 203,
    "gamme_prix": "€€€€",
    "horaires": {
      "lundi": "18:00-22:30",
      "mardi": "12:00-14:30, 18:00-22:30",
      "mercredi": "12:00-14:30, 18:00-22:30",
      "jeudi": "12:00-14:30, 18:00-22:30",
      "vendredi": "12:00-14:30, 18:00-23:00",
      "samedi": "12:00-14:30, 18:00-23:00",
      "dimanche": "18:00-22:30"
    },
    "services": ["Omakase", "Réservation obligatoire", "Bar à sushis"],
    "specialites": ["Sashimi de thon", "Maki dragon", "Mochi glacé"],
    "photos": ["https://example.com/sushi1.jpg", "https://example.com/sushi2.jpg", "https://example.com/sushi3.jpg"]
  }
];

async function testBulkImport() {
  try {
    console.log('🚀 Test d\'import en lot de restaurants...\n');
    
    const response = await fetch('http://localhost:3000/api/clients/bulk-import', {
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
    console.error('❌ Erreur de connexion:', error.message);
  }
}

// Si ce script est exécuté directement
if (require.main === module) {
  testBulkImport();
}

module.exports = { testBulkImport, restaurantsData };