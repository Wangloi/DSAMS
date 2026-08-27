import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import os from 'os';

/**
 * Get the primary valid LAN IP (non-internal IPv4, ignoring APIPA 169.254.x.x).
 * Falls back to 'localhost' if no active LAN interface is found.
 */
function getLanIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        if (/virtual|vmware|vbox|vethernet|host-only/i.test(name)) {
            continue;
        }
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // Exclude APIPA (169.254.x.x) and VirtualBox host-only (192.168.56.x) subnets
                if (
                    !iface.address.startsWith('169.254.') &&
                    !iface.address.startsWith('192.168.56.')
                ) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}

const lanIp = process.env.VITE_DEV_HOST || getLanIp();

export default defineConfig({
    server: {
        host: '0.0.0.0',
        cors: true,
        hmr: {
            host: lanIp,
        },
    },

    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
            detectTls: false,
        }),
        {
            name: 'clean-console-urls',
            configureServer(server) {
                server.printUrls = () => {
                    const logger = server.config.logger;
                    logger.info(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   http://localhost:5173/`);
                    logger.info(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m http://${lanIp}:5173/`);
                };
            },
        },
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
