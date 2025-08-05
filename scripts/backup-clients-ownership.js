// Script pour sauvegarder la propriété actuelle des clients avant migration
// Usage: node scripts/backup-clients-ownership.js

const { PrismaClient } = require('../src/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupClientsOwnership() {
  try {
    console.log('💾 Sauvegarde de la propriété des clients...\n');

    // 1. Récupérer tous les clients avec leurs propriétaires
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 ${clients.length} clients trouvés`);

    // 2. Créer la structure de sauvegarde
    const backup = {
      timestamp: new Date().toISOString(),
      totalClients: clients.length,
      clients: clients.map(client => ({
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        userId: client.userId,
        userEmail: client.user.email,
        userName: `${client.user.firstName || ''} ${client.user.lastName || ''}`.trim(),
        createdAt: client.createdAt
      }))
    };

    // 3. Statistiques de la sauvegarde
    const userStats = backup.clients.reduce((acc, client) => {
      if (!acc[client.userId]) {
        acc[client.userId] = {
          userEmail: client.userEmail,
          userName: client.userName,
          count: 0
        };
      }
      acc[client.userId].count++;
      return acc;
    }, {});

    backup.statistics = {
      userCount: Object.keys(userStats).length,
      distribution: userStats
    };

    console.log('\n📋 Distribution actuelle:');
    Object.entries(userStats).forEach(([userId, stats]) => {
      console.log(`   - ${stats.userEmail}: ${stats.count} clients`);
    });

    // 4. Générer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `clients-backup-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'backups', filename);

    // 5. Créer le dossier backups s'il n'existe pas
    const backupDir = path.dirname(filepath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`📁 Dossier de sauvegarde créé: ${backupDir}`);
    }

    // 6. Sauvegarder dans le fichier
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

    console.log(`\n✅ Sauvegarde créée avec succès !`);
    console.log(`📄 Fichier: ${filepath}`);
    console.log(`📊 ${backup.totalClients} clients sauvegardés`);
    console.log(`👥 ${backup.statistics.userCount} utilisateurs différents`);

    return filepath;

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreClientsOwnership(backupFile) {
  try {
    console.log(`🔄 Restauration depuis: ${backupFile}\n`);

    // 1. Lire le fichier de sauvegarde
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Fichier de sauvegarde non trouvé: ${backupFile}`);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📊 Sauvegarde du ${backupData.timestamp}`);
    console.log(`📋 ${backupData.totalClients} clients à restaurer`);

    // 2. Vérifier que tous les clients existent encore
    const existingClients = await prisma.client.findMany({
      select: { id: true },
      where: {
        id: {
          in: backupData.clients.map(c => c.clientId)
        }
      }
    });

    const existingIds = new Set(existingClients.map(c => c.id));
    const missingClients = backupData.clients.filter(c => !existingIds.has(c.clientId));

    if (missingClients.length > 0) {
      console.log(`⚠️  ${missingClients.length} clients de la sauvegarde n'existent plus:`);
      missingClients.forEach(client => {
        console.log(`   - ${client.clientName} (${client.clientId})`);
      });
    }

    const clientsToRestore = backupData.clients.filter(c => existingIds.has(c.clientId));
    console.log(`🎯 ${clientsToRestore.length} clients seront restaurés`);

    // 3. Effectuer la restauration
    let restoredCount = 0;
    let errorCount = 0;

    for (const client of clientsToRestore) {
      try {
        await prisma.client.update({
          where: { id: client.clientId },
          data: { userId: client.userId }
        });
        restoredCount++;
      } catch (error) {
        console.log(`❌ Erreur pour ${client.clientName}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Restauration terminée !`);
    console.log(`📊 ${restoredCount} clients restaurés`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreurs rencontrées`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function listBackups() {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('📁 Aucun dossier de sauvegarde trouvé');
      return [];
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('clients-backup-') && file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath: filepath,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    console.log('📋 Sauvegardes disponibles:\n');
    
    if (files.length === 0) {
      console.log('   Aucune sauvegarde trouvée');
      return [];
    }

    files.forEach((file, index) => {
      const sizeKB = Math.round(file.size / 1024);
      console.log(`${index + 1}. ${file.filename}`);
      console.log(`   📅 ${file.created.toLocaleString()}`);
      console.log(`   📏 ${sizeKB} KB\n`);
    });

    return files;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return [];
  }
}

// Usage en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    listBackups();
  } else if (args.includes('--restore') || args.includes('-r')) {
    const backupFile = args[args.indexOf('--restore') + 1] || args[args.indexOf('-r') + 1];
    if (!backupFile) {
      console.error('❌ Veuillez spécifier le fichier de sauvegarde');
      console.log('Usage: node scripts/backup-clients-ownership.js --restore <fichier>');
      process.exit(1);
    }
    restoreClientsOwnership(backupFile);
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  node scripts/backup-clients-ownership.js           # Créer une sauvegarde');
    console.log('  node scripts/backup-clients-ownership.js --list    # Lister les sauvegardes');
    console.log('  node scripts/backup-clients-ownership.js --restore <fichier> # Restaurer');
    console.log('  node scripts/backup-clients-ownership.js --help    # Afficher cette aide');
  } else {
    backupClientsOwnership();
  }
}

module.exports = { 
  backupClientsOwnership, 
  restoreClientsOwnership, 
  listBackups 
};