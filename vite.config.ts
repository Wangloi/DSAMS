import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Get the primary valid LAN IP (non-internal IPv4, ignoring APIPA 169.254.x.x).
 * Falls back to 'localhost' if no active LAN interface is found.
 */
function getLanIp(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        if (/virtual|vmware|vbox|vethernet/i.test(name)) {
            continue;
        }
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (!iface.address.startsWith('169.254.')) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}

/**
 * Try to load SSL cert/key from common Laragon paths.
 * Returns undefined if not found (Vite will fall back to HTTP).
 */
function loadSslCerts() {
    const searchPaths = [
        process.env.LARAGON_SSL_DIR,
        'C:/laragon/etc/ssl',
        'D:/laragon/etc/ssl',
        path.join(os.homedir(), 'laragon/etc/ssl'),
    ].filter(Boolean) as string[];

    for (const dir of searchPaths) {
        const keyPath = path.join(dir, 'laragon.key');
        const certPath = path.join(dir, 'laragon.crt');
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            return {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };
        }
    }
    return undefined;
}

const lanIp = process.env.VITE_DEV_HOST || getLanIp();
const sslCerts = loadSslCerts();
const protocol = sslCerts ? 'https' : 'http';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        cors: true,
        ...(sslCerts ? { https: sslCerts } : {}),
        hmr: {
            host: 'localhost',
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
                    logger.info(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   ${protocol}://localhost:5173/`);
                    logger.info(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m ${protocol}://${lanIp}:5173/`);
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
