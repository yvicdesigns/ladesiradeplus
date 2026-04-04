/* eslint-disable no-undef */
import fs from 'fs';
import { loadTestConfig } from './loadTestConfig.js';

export class Reporter {
  static generateReport(metricsCollector, testStartTime) {
    const stats = metricsCollector.getAllStats();
    const testEndTime = Date.now();
    const totalDurationMinutes = ((testEndTime - testStartTime) / 60000).toFixed(2);
    
    console.log('\n=============================================================');
    console.log('            Rapport de Test de Charge et de Stress           ');
    console.log('=============================================================');
    console.log(`Date: ${new Date().toLocaleString()}`);
    console.log(`Durée Totale: ${totalDurationMinutes} minutes`);
    console.log('-------------------------------------------------------------\n');

    const reportData = {
      testInfo: {
        date: new Date().toISOString(),
        durationMinutes: totalDurationMinutes,
        configUsed: loadTestConfig
      },
      scenarios: {},
      analysis: {
        bottlenecks: [],
        recommendations: []
      }
    };

    let totalErrors = 0;
    let totalRequests = 0;

    for (const [name, stat] of Object.entries(stats)) {
      if (!stat) continue;
      
      const errorRateNum = parseFloat(stat.errorRate);
      const p95Num = parseFloat(stat.p95);
      
      let performanceIcon = '✓';
      if (errorRateNum > loadTestConfig.thresholds.maxErrorRate * 100 || p95Num > loadTestConfig.thresholds.maxP95ResponseTimeMs) {
        performanceIcon = '✗';
        reportData.analysis.bottlenecks.push(`Scenario '${name}' échoué: Error Rate ${stat.errorRate}, p95 ${stat.p95}ms`);
      } else if (p95Num > loadTestConfig.thresholds.maxP95ResponseTimeMs * 0.75) {
        performanceIcon = '⚠';
      }

      console.log(`[${performanceIcon}] Scénario: ${name}`);
      console.table([{
        Requests: stat.totalRequests,
        Success: stat.successCount,
        Errors: stat.errorCount,
        ErrRate: stat.errorRate,
        RPS: stat.rps,
        AvgMs: stat.avg,
        MinMs: stat.min,
        MaxMs: stat.max,
        P95Ms: stat.p95,
        P99Ms: stat.p99
      }]);
      console.log('');

      reportData.scenarios[name] = stat;
      totalErrors += stat.errorCount;
      totalRequests += stat.totalRequests;
    }

    // Global Analysis
    console.log('=============================================================');
    console.log('Analyse Globale:');
    
    if (reportData.analysis.bottlenecks.length === 0) {
      const successMsg = '✓ Excellentes performances. Aucun goulot d\'étranglement majeur détecté.';
      console.log(successMsg);
      reportData.analysis.recommendations.push(successMsg);
    } else {
      console.log('✗ Des problèmes de performance ont été identifiés:');
      reportData.analysis.bottlenecks.forEach(b => {
        console.log(`  - ${b}`);
        reportData.analysis.recommendations.push(`Optimiser le endpoint concerné par: ${b}`);
      });
    }

    if (totalErrors > 0) {
      reportData.analysis.recommendations.push(`Analyser les logs serveur pour comprendre les ${totalErrors} erreurs survenues sur ${totalRequests} requêtes.`);
    }

    try {
      fs.writeFileSync(loadTestConfig.paths.reportOutput, JSON.stringify(reportData, null, 2));
      console.log(`\n✓ Rapport JSON généré: ${loadTestConfig.paths.reportOutput}`);
    } catch (err) {
      console.warn(`\n⚠ Impossible de sauvegarder le rapport JSON (environnements navigateur): ${err.message}`);
    }

    return reportData;
  }
}