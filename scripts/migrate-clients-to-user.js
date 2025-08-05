// Script pour migrer tous les clients vers un utilisateur spécifique
// Usage: node scripts/migrate-clients-to-user.js

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

const TARGET_USER_ID = 'cmdw4dt4i002tnx0ktyeby281';

async function migrateClientsToUser() {
  try {
    console.log('🔄 Migration des clients en cours...\n');
    console.log(`🎯 Utilisateur cible: ${TARGET_USER_ID}`);

    // 1. Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!targetUser) {
      throw new Error(`❌ Utilisateur avec l'ID ${TARGET_USER_ID} non trouvé`);
    }

    console.log(`✅ Utilisateur cible trouvé:`);
    console.log(`   - Email: ${targetUser.email}`);
    console.log(`   - Nom: ${targetUser.firstName || ''} ${targetUser.lastName || ''}`);
    console.log('');

    // 2. Compter le nombre de clients à migrer
    const totalClients = await prisma.client.count({
      where: {
        userId: {
          not: TARGET_USER_ID
        }
      }
    });

    if (totalClients === 0) {
      console.log('✅ Aucun client à migrer. Tous les clients appartiennent déjà à cet utilisateur.');
      return;
    }

    console.log(`📊 Nombre de clients à migrer: ${totalClients}`);

    // 3. Obtenir la liste des utilisateurs actuels des clients
    const currentOwners = await prisma.client.groupBy({
      by: ['userId'],
      where: {
        userId: {
          not: TARGET_USER_ID
        }
      },
      _count: {
        id: true
      }
    });

    console.log('\n📋 Répartition actuelle:');
    for (const owner of currentOwners) {
      const user = await prisma.user.findUnique({
        where: { id: owner.userId },
        select: { email: true, firstName: true, lastName: true }
      });
      
      const userName = user ? 
        `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim() : 
        'Utilisateur inconnu';
      
      console.log(`   - ${owner.userId}: ${owner._count.id} clients (${userName})`);
    }

    // 4. Confirmer la migration
    console.log('\n⚠️  ATTENTION: Cette opération va modifier TOUS les clients pour les associer au nouvel utilisateur.');
    console.log('Cette action est IRRÉVERSIBLE.\n');

    // En mode script, on peut ajouter une confirmation
    // Pour l'instant, on procède directement
    console.log('🚀 Démarrage de la migration...\n');

    // 5. Effectuer la migration
    const updateResult = await prisma.client.updateMany({
      where: {
        userId: {
          not: TARGET_USER_ID
        }
      },
      data: {
        userId: TARGET_USER_ID
      }
    });

    console.log(`✅ Migration terminée !`);
    console.log(`📊 ${updateResult.count} clients ont été migrés vers l'utilisateur ${TARGET_USER_ID}`);

    // 6. Vérification finale
    const finalCount = await prisma.client.count({
      where: {
        userId: TARGET_USER_ID
      }
    });

    console.log(`\n🎯 Résultat final:`);
    console.log(`   - Nombre total de clients pour ${targetUser.email}: ${finalCount}`);

    // 7. Vérifier qu'il ne reste aucun client avec d'autres utilisateurs
    const remainingClients = await prisma.client.count({
      where: {
        userId: {
          not: TARGET_USER_ID
        }
      }
    });

    if (remainingClients === 0) {
      console.log('✅ Tous les clients ont été migrés avec succès !');
    } else {
      console.log(`⚠️  Il reste ${remainingClients} clients avec d'autres utilisateurs`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function showCurrentDistribution() {
  try {
    console.log('📊 Distribution actuelle des clients par utilisateur:\n');

    const distribution = await prisma.client.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    for (const item of distribution) {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { 
          email: true, 
          firstName: true, 
          lastName: true,
          isActive: true
        }
      });
      
      const userName = user ? 
        `${user.firstName || ''} ${user.lastName || ''} (${user.email})${!user.isActive ? ' [INACTIF]' : ''}`.trim() : 
        'Utilisateur inconnu';
      
      const isTarget = item.userId === TARGET_USER_ID ? ' 🎯' : '';
      
      console.log(`📋 ${item.userId}${isTarget}`);
      console.log(`   └─ ${item._count.id} clients - ${userName}`);
    }

    const totalClients = await prisma.client.count();
    console.log(`\n📊 Total: ${totalClients} clients`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour faire un rollback (optionnel)
async function rollbackMigration(originalDistribution) {
  try {
    console.log('🔄 Rollback de la migration...\n');
    
    // Cette fonction pourrait être utilisée pour restaurer la distribution originale
    // Elle nécessiterait de sauvegarder l'état original avant la migration
    
    console.log('⚠️  Le rollback n\'est pas implémenté dans cette version.');
    console.log('Pour restaurer, vous devez avoir une sauvegarde de la base de données.');
    
  } catch (error) {
    console.error('❌ Erreur lors du rollback:', error.message);
  }
}

// Usage en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--status') || args.includes('-s')) {
    showCurrentDistribution();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node scripts/migrate-clients-to-user.js          # Migrer tous les clients');
    console.log('  node scripts/migrate-clients-to-user.js --status # Voir la distribution actuelle');
    console.log('  node scripts/migrate-clients-to-user.js --help   # Afficher cette aide');
  } else {
    migrateClientsToUser();
  }
}

module.exports = { 
  migrateClientsToUser, 
  showCurrentDistribution, 
  TARGET_USER_ID 
};