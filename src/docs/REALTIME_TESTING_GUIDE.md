# Realtime & Fallback Integration Testing Guide

This guide documents how to test the robust WebSocket Realtime connection and its HTTP Polling fallback mechanism in the application.

## 1. Simulated Disconnections
We provide a built-in development tool to simulate network failures without physically disconnecting your device.
1. Enable the `RealtimeDebugPanel` (visible by default in dev environments at the bottom right).
2. Click **"Simulate Disconnect (8s)"**.
3. Observe the `ConnectionStatusMonitor` UI transition from "Connecté" (Green) to "Mode Polling" (Orange/Red).
4. Verify that data (like Orders or Menu items) still refreshes via HTTP polling every 3 seconds.

## 2. Polling Fallback Verification
When Realtime fails, the application automatically mounts `PollingService.js`.
1. Open your browser's **Network Tab**.
2. Filter by `Fetch/XHR`.
3. Simulate a failure (or block WebSocket connections via Chrome DevTools).
4. You should see repeated HTTP requests to the Supabase REST API (e.g., `GET /rest/v1/orders`) at intervals matching your configuration (e.g., 2000-3000ms).
5. Once the Realtime connection is re-established (Health check passes), these HTTP polling requests should immediately cease.

## 3. Performance Benchmarks
- **Micro-disconnection Detection:** The `RealtimeHealthCheck` sends a heartbeat every 1 second.
- **Reconnection Time:** < 2 seconds (using exponential backoff 1s, 2s, 4s).
- **Fallback Trigger:** < 3 seconds after consecutive missed heartbeats.

## 4. Troubleshooting Common Issues
- **Infinite Reconnection Loops:** Ensure `fetchData` functions wrapped in `useRealtimeWithFallback` are wrapped in `useCallback` to prevent constant re-renders.
- **Missing Data during Fallback:** Verify that the `PollingService` is correctly receiving the `fetchData` reference and that RLS policies allow SELECT queries via standard HTTP API.
- **Duplicate Data Updates:** The `useRealtimeWithFallback` deduplicates manual triggers via a 500ms debounce. If you see flickers, check the debounce ref inside the hook.

## 5. Monitoring Dashboard Setup
For administrators, the UI displays connection metrics at the bottom left:
- **Green Wifi:** Healthy Realtime connection.
- **Yellow Wifi:** Latency > 1000ms.
- **Orange Server:** WebSocket blocked, active Polling fallback.
- **Red Wifi:** Complete disconnection.