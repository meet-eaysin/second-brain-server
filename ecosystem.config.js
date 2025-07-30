module.exports = {
  apps: [
    {
      name: 'second-brain-server',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'coverage'],
      max_memory_restart: '1G',
      
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Environment variables
      env_file: '.env'
    }
  ],

  deploy: {
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:meet-eaysin/second-brain-server.git',
      path: '/var/www/second-brain-staging',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install --production && yarn build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    },
    
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:meet-eaysin/second-brain-server.git',
      path: '/var/www/second-brain-production',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install --production && yarn build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
