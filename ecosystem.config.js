// PM2 Ecosystem Configuration for Void Collector
// NOTE: Environment variables should be set on the server, not in this file
// Copy .env.production to the server and load via dotenv or system env

module.exports = {
    apps: [{
        name: 'void-collector',
        script: 'npm',
        args: 'start',
        cwd: '/var/www/void-collector',
        exec_mode: 'fork', // CRITICAL: fork mode to avoid port conflicts
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production',
            PORT: 3003
            // Other env vars should be loaded from .env.production on the server
            // DO NOT commit secrets to git!
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
}
