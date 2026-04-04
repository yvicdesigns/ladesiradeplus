import { supabase } from '@/lib/customSupabaseClient';

export const runPerformanceTests = async () => {
  const issues = [];
  let score = 100;
  
  const metrics = {
    menuLoadTimeMs: 0,
    orderCreationTimeMs: 0,
    trackingSpeedMs: 0,
    memoryLeakDetected: false
  };

  try {
    // Measure Menu Load
    const startMenu = performance.now();
    await supabase.from('menu_items').select('id').limit(10);
    metrics.menuLoadTimeMs = Math.round(performance.now() - startMenu);

    if (metrics.menuLoadTimeMs > 1000) {
      issues.push({
        id: 'PERF-01',
        severity: 'Majeur',
        title: 'Lenteur de chargement du Menu',
        description: `Le fetch a pris ${metrics.menuLoadTimeMs}ms (idéal < 500ms).`,
        recommendation: 'Vérifier les index de la base de données ou implémenter un cache.'
      });
      score -= 15;
    } else if (metrics.menuLoadTimeMs > 500) {
      issues.push({
        id: 'PERF-02',
        severity: 'Mineur',
        title: 'Temps de réponse de la base perfectible',
        description: `Le fetch a pris ${metrics.menuLoadTimeMs}ms.`,
        recommendation: 'Optimiser les requêtes (select spécifiques).'
      });
      score -= 5;
    }

    // Heuristic Memory Check
    const memory = performance?.memory;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      issues.push({
        id: 'PERF-03',
        severity: 'Critique',
        title: 'Utilisation mémoire critique',
        description: 'La consommation mémoire approche la limite (Fuite potentielle).',
        recommendation: 'Vérifier les abonnements Realtime non désinscrits et les écouteurs d\'événements.'
      });
      score -= 30;
      metrics.memoryLeakDetected = true;
    }

  } catch (err) {
    issues.push({
      id: 'PERF-00',
      severity: 'Critique',
      title: 'Échec des tests de performance',
      description: err.message,
      recommendation: 'Vérifier la connectivité.'
    });
    score = 0;
  }

  return {
    category: 'PERFORMANCE',
    score: Math.max(0, score),
    issues,
    metrics
  };
};