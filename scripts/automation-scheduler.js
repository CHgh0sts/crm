#!/usr/bin/env node

/**
 * Script d'automatisation côté serveur
 * Ce script s'exécute indépendamment du navigateur
 * Peut être lancé avec cron pour une exécution périodique
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCHEDULER_ENDPOINT = `${BASE_URL}/api/automations/scheduler`;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Fonction fetch personnalisée avec modules HTTP natifs
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Automation-Scheduler-Script'
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => Promise.resolve(JSON.parse(data))
          };
          resolve(result);
        } catch (error) {
          reject(new Error(`Erreur de parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Timeout de la requête'));
    });

    req.end();
  });
}

async function runScheduler() {
  try {
    logInfo('Démarrage du vérificateur d\'automatisations...');
    
    const response = await makeRequest(SCHEDULER_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.executedCount > 0) {
      logSuccess(`${result.executedCount} automatisation(s) exécutée(s)`);
      
      // Détailler les résultats
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach(item => {
          switch (item.status) {
            case 'SUCCESS':
              logSuccess(`"${item.name}" - Prochaine exécution: ${item.nextExecution}`);
              break;
            case 'FAILED':
              logError(`"${item.name}" - Erreur: ${item.error}`);
              break;
            case 'CRITICAL_ERROR':
              logError(`"${item.name}" - Erreur critique: ${item.error}`);
              break;
            default:
              logWarning(`"${item.name}" - Statut inconnu: ${item.status}`);
          }
        });
      }
    } else {
      logInfo('Aucune automatisation à exécuter pour le moment');
    }

    logSuccess('Vérification terminée avec succès');
    return true;

  } catch (error) {
    logError(`Erreur lors de l'exécution du scheduler: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      logError('Impossible de se connecter au serveur. Vérifiez que l\'application est démarrée.');
    }
    
    return false;
  }
}

// Mode continu (pour développement)
async function runContinuous() {
  logInfo('Mode continu activé - Vérification toutes les 60 secondes');
  logWarning('Appuyez sur Ctrl+C pour arrêter');
  
  // Fonction pour gérer l'arrêt propre
  process.on('SIGINT', () => {
    logInfo('Arrêt du scheduler en cours...');
    process.exit(0);
  });

  // Boucle infinie avec vérifications périodiques
  while (true) {
    await runScheduler();
    
    // Attendre 30 secondes avant la prochaine vérification
    logInfo('Attente de 30 secondes avant la prochaine vérification...');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

// Mode unique (pour cron)
async function runOnce() {
  const success = await runScheduler();
  process.exit(success ? 0 : 1);
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);
  const continuous = args.includes('--continuous') || args.includes('-c');
  
  log('🤖 Automation Scheduler - Version serveur', 'cyan');
  log(`📍 URL cible: ${BASE_URL}`, 'blue');
  
  if (continuous) {
    await runContinuous();
  } else {
    await runOnce();
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  logError(`Promesse rejetée non gérée: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Exception non capturée: ${error.message}`);
  process.exit(1);
});

// Lancer le script
if (require.main === module) {
  main().catch(error => {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runScheduler, runOnce, runContinuous }; 