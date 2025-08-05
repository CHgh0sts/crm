// Script sécurisé pour migrer tous les clients vers un utilisateur spécifique
// Effectue automatiquement une sauvegarde avant la migration
// Usage: node scripts/safe-migrate-clients.js

const { backupClientsOwnership } = require('./backup-clients-ownership');
const { migrateClientsToUser, showCurrentDistribution, TARGET_USER_ID } = require('./migrate-clients-to-user');

async function safeMigrateClients() {
  try {
    console.log('🔒 Migration sécurisée des clients\n');
    console.log(`🎯 Utilisateur cible: ${TARGET_USER_ID}\n`);

    // 1. Afficher la distribution actuelle
    console.log('📊 ÉTAT ACTUEL:');
    console.log('='.repeat(50));
    await showCurrentDistribution();
    console.log('\n');

    // 2. Créer une sauvegarde automatique
    console.log('💾 SAUVEGARDE AUTOMATIQUE:');
    console.log('='.repeat(50));
    const backupFile = await backupClientsOwnership();
    console.log('\n');

    // 3. Effectuer la migration
    console.log('🚀 MIGRATION:');
    console.log('='.repeat(50));
    await migrateClientsToUser();
    console.log('\n');

    // 4. Afficher le résultat final
    console.log('📊 ÉTAT FINAL:');
    console.log('='.repeat(50));
    await showCurrentDistribution();
    console.log('\n');

    // 5. Instructions de rollback
    console.log('🔄 INSTRUCTIONS DE ROLLBACK:');
    console.log('='.repeat(50));
    console.log('Si vous souhaitez annuler cette migration, utilisez:');
    console.log(`node scripts/backup-clients-ownership.js --restore "${backupFile}"`);
    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error.message);
    console.log('\n🚨 La migration a échoué. Vos données sont intactes.');
    process.exit(1);
  }
}

// Fonction pour confirmer l'action en mode interactif
async function confirmMigration() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('⚠️  Êtes-vous sûr de vouloir migrer TOUS les clients vers cet utilisateur ? (oui/non): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Usage en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--force') || args.includes('-f')) {
    // Mode automatique sans confirmation
    safeMigrateClients();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Script de migration sécurisée des clients');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/safe-migrate-clients.js         # Migration avec confirmation');
    console.log('  node scripts/safe-migrate-clients.js --force # Migration sans confirmation');
    console.log('  node scripts/safe-migrate-clients.js --help  # Afficher cette aide');
    console.log('');
    console.log('Fonctionnalités:');
    console.log('  ✅ Sauvegarde automatique avant migration');
    console.log('  ✅ Affichage de l\'état avant/après');
    console.log('  ✅ Instructions de rollback');
    console.log('  ✅ Gestion d\'erreurs robuste');
  } else {
    // Mode interactif avec confirmation
    (async () => {
      console.log('🔒 Migration sécurisée des clients\n');
      console.log(`🎯 Utilisateur cible: ${TARGET_USER_ID}\n`);
      
      console.log('📊 Distribution actuelle:');
      await showCurrentDistribution();
      console.log('\n');
      
      const confirmed = await confirmMigration();
      
      if (confirmed) {
        console.log('\n✅ Migration confirmée. Démarrage...\n');
        await safeMigrateClients();
      } else {
        console.log('\n❌ Migration annulée par l\'utilisateur.');
      }
    })();
  }
}

module.exports = { safeMigrateClients };