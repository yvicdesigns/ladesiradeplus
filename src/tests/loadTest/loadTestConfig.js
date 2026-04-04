/* eslint-disable no-undef */
export const loadTestConfig = {
  durationMinutes: 10, // 5-10 minutes
  scenarios: {
    menuFetch: {
      users: 200,
      staggerIntervalMs: 50, // Stagger requests by 50ms
    },
    addToCart: {
      users: 100,
      staggerIntervalMs: 100,
    },
    createOrder: {
      users: 80,
      staggerIntervalMs: 150,
    },
    updateStatus: {
      users: 40,
      staggerIntervalMs: 200,
    },
    sendNotification: {
      users: 40,
      staggerIntervalMs: 200,
    }
  },
  endpoints: {
    menu: '/api/menu',
    cartAdd: '/api/cart/add',
    orderCreate: '/api/orders/create',
    orderStatus: '/api/orders/:id/status',
    notification: '/api/notifications/send'
  },
  timeouts: {
    requestTimeoutMs: 15000, // 15 seconds max per request
  },
  thresholds: {
    maxErrorRate: 0.05, // 5% max error rate
    maxP95ResponseTimeMs: 2000, // 2 seconds
  },
  paths: {
    reportOutput: './loadTestReport.json',
    targetDirectory: './src/tests/loadTest'
  },
  cleanup: {
    autoClean: true,
  }
};