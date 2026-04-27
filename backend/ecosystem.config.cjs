/**
 * PM2 Ecosystem Config — Rares360
 * Cluster mode para aproveitar múltiplos cores do servidor.
 */
module.exports = {
    apps: [
        {
            name: 'rares360-api',
            script: 'npx',
            args: 'tsx src/server.ts',
            instances: 'max',        // Usar todos os CPUs disponíveis
            exec_mode: 'cluster',
            max_memory_restart: '512M',
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            // Graceful shutdown
            kill_timeout: 30000,
            listen_timeout: 10000,
            // Logs
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
