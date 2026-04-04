/* eslint-disable no-undef */
import { MetricsCollector } from './metrics.js';
import { Scenarios } from './scenarios.js';
import { Reporter } from './reporter.js';
import { executeCleanup } from './cleanup.js';

const runLoadTest = async () => {
  console.log('=============================================================');
  console.log('       DÉMARRAGE DU RUNNER DE TEST DE CHARGE ISOLE           ');
  console.log('=============================================================');
  
  const metricsCollector = new MetricsCollector();
  const testStartTime = Date.now();

  try {
    // We execute them with controlled concurrency. 
    // Wait for one to finish before starting the next to avoid overwhelming the local thread,
    // or run them in Promise.all for maximum stress.
    // The instructions say: "Execute all 5 scenarios sequentially or with controlled concurrency"
    console.log('\nÉtape 1/3: Exécution des scénarios...');
    
    await Promise.all([
      Scenarios.fetchMenu(metricsCollector),
      Scenarios.addToCart(metricsCollector),
      Scenarios.createOrder(metricsCollector),
      Scenarios.updateOrderStatus(metricsCollector),
      Scenarios.sendNotification(metricsCollector)
    ]);

    console.log('\nÉtape 2/3: Génération des rapports...');
    Reporter.generateReport(metricsCollector, testStartTime);

    console.log('\nÉtape 3/3: Nettoyage post-test...');
    await executeCleanup();

    console.log('\n✓ FIN DES TESTS DE CHARGE');
  } catch (error) {
    console.error('\n✗ UNE ERREUR CRITIQUE EST SURVENUE PENDANT LES TESTS:', error);
  }
};

// Start the runner automatically if executed via Node
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  runLoadTest();
}

export { runLoadTest };