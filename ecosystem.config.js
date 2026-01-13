// PM2 Ecosystem Configuration for Void Collector
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
            PORT: 3003, // Changed from 3002, void-bastion uses 3000
            NEXT_PUBLIC_SUPABASE_URL: 'https://wrruwhauyttrbgjrkcje.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzcyODMsImV4cCI6MjA4MjY1MzI4M30.aacH8UmW3JNoWUDBBjfxOi0JUMjpBR-IiVnZ3jFI5zM',
            SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzI4MywiZXhwIjoyMDgyNjUzMjgzfQ.7F9-zr3AbUw8HLdzkS8v4v_qmk5NL-n-dN9yzp_sDLM',
            NEXT_PUBLIC_MINIKIT_APP_ID: 'app_e3c317455f168a14ab972dbe4f34ab9a',
            NEXT_PUBLIC_WORLD_CHAIN_RPC: 'https://worldchain-mainnet.rpc.com'
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
}
