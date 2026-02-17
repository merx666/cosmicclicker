module.exports = {
    apps: [{
        name: "void-collector",
        script: ".next/standalone/server.js",
        cwd: "/var/www/void-collector",
        instances: 1,
        exec_mode: "fork",
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
            NODE_ENV: "production",
            PORT: 3003,
            HOSTNAME: "0.0.0.0"
        },
        error_file: "./logs/err.log",
        out_file: "./logs/out.log",
        time: true
    }]
}
