import { supabase } from '@/lib/customSupabaseClient';

class RealtimeHealthCheckService {
  constructor() {
    this.isHealthy = false;
    this.lastCheck = null;
    this.failureCount = 0;
    this.uptime = 0;
    this.channel = null;
    this.checkInterval = null;
    this.listeners = new Set();
    this.startTime = Date.now();
    this.isChecking = false;
    this.latency = 0;
    this.healthScore = 100;
    
    // Testing features
    this.simulatedFailure = false;

    /**
     * OPTIMIZATION RATIONALE:
     * Changed from 1s to 10s to significantly reduce:
     * 1. Server Load: Decreases concurrent broadcast messages processed by Supabase Realtime.
     * 2. Bandwidth: Reduces data usage for mobile clients.
     * 3. Battery Consumption: Less frequent network wake-ups on mobile devices.
     * Reliability is maintained as 10s is sufficient for detecting persistent connection drops 
     * while the underlying WebSocket protocol handles immediate socket closures.
     */
    this.PING_INTERVAL_MS = 10000; 
  }

  start() {
    if (this.checkInterval) return;
    this.setupHealthChannel();
    
    // Updated to use the optimized interval constant
    this.checkInterval = setInterval(() => this.performCheck(), this.PING_INTERVAL_MS);
    this.performCheck();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel).catch(() => {});
      this.channel = null;
    }
  }

  setupHealthChannel() {
    if (this.channel) {
      supabase.removeChannel(this.channel).catch(() => {});
    }
    
    this.channel = supabase.channel('system_health_check')
      .on('broadcast', { event: 'ping' }, (payload) => {
        const pingTime = payload.payload?.timestamp || Date.now();
        this.latency = Date.now() - pingTime;
        this.markHealthy();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.markHealthy();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.markUnhealthy(status);
        }
      });
  }

  async performCheck() {
    if (this.isChecking || this.simulatedFailure) {
      if (this.simulatedFailure) this.markUnhealthy('simulated_failure');
      return;
    }
    
    this.isChecking = true;
    try {
      if (this.channel && this.channel.state === 'joined') {
        await this.channel.send({
          type: 'broadcast',
          event: 'ping',
          payload: { timestamp: Date.now() }
        });
      } else if (this.channel?.state !== 'joining') {
        this.setupHealthChannel();
      }
    } catch (err) {
      this.markUnhealthy(err.message);
    } finally {
      this.isChecking = false;
    }
  }

  markHealthy() {
    if (this.simulatedFailure) return;
    this.isHealthy = true;
    this.lastCheck = new Date();
    this.failureCount = 0;
    this.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    // Increased health recovery per check to compensate for lower frequency
    this.healthScore = Math.min(100, this.healthScore + 10); 
    this.emit('health-check-passed', this.getHealthStatus());
  }

  markUnhealthy(reason) {
    this.isHealthy = false;
    this.lastCheck = new Date();
    this.failureCount += 1;
    this.healthScore = Math.max(0, this.healthScore - 15);
    this.emit('health-check-failed', this.getHealthStatus());
  }

  getHealthStatus() {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      uptime: this.uptime,
      failureCount: this.failureCount,
      latency: this.latency,
      score: this.healthScore,
      status: this.isHealthy ? 'connected' : (this.failureCount < 3 ? 'reconnecting' : 'disconnected')
    };
  }

  getConnectionStatus() {
    return this.getHealthStatus();
  }

  checkConnection() {
    this.performCheck();
    return this.isHealthy;
  }

  simulateDisconnection(duration = 5000) {
    this.simulatedFailure = true;
    this.markUnhealthy('simulated_failure');
    if (this.channel) supabase.removeChannel(this.channel);
    
    setTimeout(() => {
      this.simulatedFailure = false;
      this.setupHealthChannel();
    }, duration);
  }

  subscribeToStatusChanges(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(event, data) {
    this.listeners.forEach(cb => cb({ event, data }));
  }
}

export const realtimeHealthCheck = new RealtimeHealthCheckService();