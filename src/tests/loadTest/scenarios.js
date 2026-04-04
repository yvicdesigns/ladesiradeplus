/* eslint-disable no-undef */
import { loadTestConfig } from './loadTestConfig.js';

// Helper to simulate request delay and response
const simulateRequest = async (endpoint, minDelay = 50, maxDelay = 300) => {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate 2% random error rate just to have realistic data
  const isError = Math.random() < 0.02; 
  if (isError) {
    throw new Error(`Simulated Network Error on ${endpoint}`);
  }
  return { status: 200, data: { success: true } };
};

const executeStaggered = async (scenarioName, count, staggerMs, executeFn, metricsCollector) => {
  metricsCollector.initScenario(scenarioName);
  
  const promises = [];
  for (let i = 0; i < count; i++) {
    const promise = new Promise(async (resolve) => {
      // Stagger
      await new Promise(r => setTimeout(r, i * staggerMs));
      
      const start = performance.now();
      try {
        await executeFn(i);
        const duration = performance.now() - start;
        metricsCollector.recordRequest(scenarioName, duration, true, 200);
      } catch (err) {
        const duration = performance.now() - start;
        metricsCollector.recordRequest(scenarioName, duration, false, 500);
      }
      resolve();
    });
    promises.push(promise);
  }
  
  await Promise.all(promises);
  metricsCollector.endScenario(scenarioName);
};

export const Scenarios = {
  // Scenario 1: Fetch Menu
  fetchMenu: async (metricsCollector) => {
    console.log(`Démarrage Scénario 1: Fetch Menu (${loadTestConfig.scenarios.menuFetch.users} users)`);
    await executeStaggered(
      'FetchMenu', 
      loadTestConfig.scenarios.menuFetch.users, 
      loadTestConfig.scenarios.menuFetch.staggerIntervalMs,
      () => simulateRequest(loadTestConfig.endpoints.menu, 20, 150),
      metricsCollector
    );
  },

  // Scenario 2: Add to Cart
  addToCart: async (metricsCollector) => {
    console.log(`Démarrage Scénario 2: Add to Cart (${loadTestConfig.scenarios.addToCart.users} users)`);
    await executeStaggered(
      'AddToCart', 
      loadTestConfig.scenarios.addToCart.users, 
      loadTestConfig.scenarios.addToCart.staggerIntervalMs,
      () => simulateRequest(loadTestConfig.endpoints.cartAdd, 40, 200),
      metricsCollector
    );
  },

  // Scenario 3: Create Order
  createOrder: async (metricsCollector) => {
    console.log(`Démarrage Scénario 3: Create Order (${loadTestConfig.scenarios.createOrder.users} users)`);
    await executeStaggered(
      'CreateOrder', 
      loadTestConfig.scenarios.createOrder.users, 
      loadTestConfig.scenarios.createOrder.staggerIntervalMs,
      () => simulateRequest(loadTestConfig.endpoints.orderCreate, 100, 500),
      metricsCollector
    );
  },

  // Scenario 4: Update Order Status
  updateOrderStatus: async (metricsCollector) => {
    console.log(`Démarrage Scénario 4: Update Order Status (${loadTestConfig.scenarios.updateStatus.users} users)`);
    await executeStaggered(
      'UpdateOrderStatus', 
      loadTestConfig.scenarios.updateStatus.users, 
      loadTestConfig.scenarios.updateStatus.staggerIntervalMs,
      () => simulateRequest(loadTestConfig.endpoints.orderStatus, 80, 400),
      metricsCollector
    );
  },

  // Scenario 5: Send Notification
  sendNotification: async (metricsCollector) => {
    console.log(`Démarrage Scénario 5: Send Notification (${loadTestConfig.scenarios.sendNotification.users} users)`);
    await executeStaggered(
      'SendNotification', 
      loadTestConfig.scenarios.sendNotification.users, 
      loadTestConfig.scenarios.sendNotification.staggerIntervalMs,
      () => simulateRequest(loadTestConfig.endpoints.notification, 50, 250),
      metricsCollector
    );
  }
};