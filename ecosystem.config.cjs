module.exports = {
  apps: [{
    name: 'shuttle',
    script: 'index.js',
    instances: 2, // Use both CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // Memory optimization
    node_args: '--max-old-space-size=1024 --optimize-for-size',
    // Performance monitoring
    pmx: true,
    // Resource limits
    max_memory_restart: '800M',
    // Graceful reload
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    // Logging
    log_type: 'json',
    merge_logs: true,
    time: true
  }]
}