// Script pour tester le nombre de clients retournés par l'API
// Usage: node scripts/test-client-count.js

async function testClientCount() {
  try {
    console.log('🧪 Test du nombre de clients via API...\n');

    // Test avec limite par défaut (20)
    console.log('1. Test avec limite par défaut:');
    const defaultResponse = await fetch('http://localhost:3000/api/clients?limit=20');
    if (defaultResponse.ok) {
      const defaultData = await defaultResponse.json();
      console.log(`   ✅ ${defaultData.clients?.length || 0} clients (limite 20)`);
    } else {
      console.log(`   ❌ Erreur: ${defaultResponse.status}`);
    }

    // Test avec tous les clients
    console.log('\n2. Test avec tous les clients:');
    const allResponse = await fetch('http://localhost:3000/api/clients?limit=all');
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`   ✅ ${allData.clients?.length || 0} clients (tous)`);
      console.log(`   📊 Total dans la BD: ${allData.totalCount || 'inconnu'}`);
    } else {
      console.log(`   ❌ Erreur: ${allResponse.status}`);
    }

    // Test sans paramètre (devrait maintenant retourner tous)
    console.log('\n3. Test sans paramètre limit:');
    const noLimitResponse = await fetch('http://localhost:3000/api/clients');
    if (noLimitResponse.ok) {
      const noLimitData = await noLimitResponse.json();
      console.log(`   ✅ ${noLimitData.clients?.length || 0} clients (sans paramètre)`);
    } else {
      console.log(`   ❌ Erreur: ${noLimitResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n💡 Assurez-vous que le serveur de développement est démarré:');
    console.log('   npm run dev');
  }
}

// Test de la base de données directement
async function testDatabaseCount() {
  try {
    const { PrismaClient } = require('../src/generated/prisma');
    const prisma = new PrismaClient();

    console.log('\n🗄️  Test direct de la base de données:');
    
    const totalClients = await prisma.client.count();
    console.log(`   📊 Total clients en BD: ${totalClients}`);

    const clientsByUser = await prisma.client.groupBy({
      by: ['userId'],
      _count: { id: true }
    });

    console.log('\n   📋 Répartition par utilisateur:');
    for (const item of clientsByUser) {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { email: true }
      });
      console.log(`   - ${item.userId}: ${item._count.id} clients (${user?.email || 'inconnu'})`);
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erreur BD:', error.message);
  }
}

// Si ce script est exécuté directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--db')) {
    testDatabaseCount();
  } else if (args.includes('--all')) {
    testDatabaseCount().then(() => testClientCount());
  } else {
    testClientCount();
  }
}

module.exports = { testClientCount, testDatabaseCount };