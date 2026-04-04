/* eslint-disable no-undef */
export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
  }

  initScenario(scenarioName) {
    if (!this.metrics.has(scenarioName)) {
      this.metrics.set(scenarioName, {
        name: scenarioName,
        requests: [],
        successCount: 0,
        errorCount: 0,
        startTime: Date.now(),
        endTime: null,
      });
    }
  }

  recordRequest(scenarioName, responseTime, isSuccess, statusCode) {
    const scenario = this.metrics.get(scenarioName);
    if (!scenario) return;

    scenario.requests.push({ responseTime, isSuccess, statusCode, timestamp: Date.now() });
    
    if (isSuccess) {
      scenario.successCount++;
    } else {
      scenario.errorCount++;
    }
  }

  endScenario(scenarioName) {
    const scenario = this.metrics.get(scenarioName);
    if (scenario) {
      scenario.endTime = Date.now();
    }
  }

  calculatePercentile(times, percentile) {
    if (times.length === 0) return 0;
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  getScenarioStats(scenarioName) {
    const scenario = this.metrics.get(scenarioName);
    if (!scenario || scenario.requests.length === 0) return null;

    const times = scenario.requests.map(r => r.responseTime);
    const totalRequests = scenario.requests.length;
    const durationSec = ((scenario.endTime || Date.now()) - scenario.startTime) / 1000;
    
    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95 = this.calculatePercentile(times, 95);
    const p99 = this.calculatePercentile(times, 99);
    const errorRate = scenario.errorCount / totalRequests;
    const rps = durationSec > 0 ? totalRequests / durationSec : 0;

    return {
      name: scenarioName,
      totalRequests,
      successCount: scenario.successCount,
      errorCount: scenario.errorCount,
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      errorRate: (errorRate * 100).toFixed(2) + '%',
      rps: rps.toFixed(2),
      durationSec: durationSec.toFixed(2)
    };
  }

  getAllStats() {
    const allStats = {};
    for (const key of this.metrics.keys()) {
      allStats[key] = this.getScenarioStats(key);
    }
    return allStats;
  }
}