#!/usr/bin/env node
/**
 * Hostinger Automated SFTP & SSH Deployment Tool for DSAMS
 * (Laravel + React/Inertia on Windows / Laragon)
 *
 * Usage:
 *   npm run deploy           # Full build + SFTP upload + remote artisan optimize
 *   npm run deploy:quick     # SFTP upload without re-running npm run build
 *   npm run deploy:watch     # Watch local files and auto-deploy changes on save
 *   npm run deploy:dry-run   # Preview files to upload without making changes
 *   npm run deploy:artisan   # Run remote artisan optimization commands only
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Client as SshClient } from 'ssh2';
import SftpClient from 'ssh2-sftp-client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ANSI Color Helpers
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    step: (step, msg) =>
        console.log(
            `\n${colors.bright}${colors.blue}===> [Step ${step}] ${msg}${colors.reset}`,
        ),
};

// Parse CLI flags
const args = process.argv.slice(2);
const IS_QUICK = args.includes('--quick');
const IS_WATCH = args.includes('--watch');
const IS_DRY_RUN = args.includes('--dry-run');
const IS_ARTISAN_ONLY = args.includes('--artisan-only');

// Load .env.deploy
const deployEnvPath = path.join(ROOT_DIR, '.env.deploy');
if (!fs.existsSync(deployEnvPath)) {
    log.error(`Missing deployment configuration file: .env.deploy`);
    console.log(`
${colors.yellow}Please create a .env.deploy file in your project root with your Hostinger credentials:${colors.reset}
  Copy from .env.deploy.example:
  -------------------------------------------------------------
  DEPLOY_HOST=145.223.108.79
  DEPLOY_PORT=65002
  DEPLOY_USER=u951336596
  DEPLOY_PASSWORD=your_hostinger_password_here
  DEPLOY_REMOTE_PATH=/home/u951336596/domains/dsa.srcbitsys.io/public_html
  DEPLOY_RUN_ARTISAN=true
  -------------------------------------------------------------
`);
    process.exit(1);
}

dotenv.config({ path: deployEnvPath });

const config = {
    host: process.env.DEPLOY_HOST?.trim(),
    port: parseInt(process.env.DEPLOY_PORT || '65002', 10),
    username: process.env.DEPLOY_USER?.trim(),
    password: process.env.DEPLOY_PASSWORD || undefined,
    privateKeyPath: process.env.DEPLOY_PRIVATE_KEY?.trim() || undefined,
    remotePath: (
        process.env.DEPLOY_REMOTE_PATH ||
        '/home/u951336596/domains/dsa.srcbitsys.io/public_html'
    ).replace(/\/+$/, ''),
    runArtisan: process.env.DEPLOY_RUN_ARTISAN === 'true',
    phpBin: process.env.DEPLOY_PHP_BIN || 'php',
};

// Validation
if (!config.host || !config.username) {
    log.error('DEPLOY_HOST and DEPLOY_USER are required in .env.deploy');
    process.exit(1);
}
if (!config.password && !config.privateKeyPath && !IS_DRY_RUN) {
    log.error(
        'Either DEPLOY_PASSWORD or DEPLOY_PRIVATE_KEY must be provided in .env.deploy',
    );
    process.exit(1);
} else if (!config.password && !config.privateKeyPath && IS_DRY_RUN) {
    log.warn('No password or private key in .env.deploy (Permitted in --dry-run mode).');
}

let privateKeyContent = undefined;
if (config.privateKeyPath) {
    if (fs.existsSync(config.privateKeyPath)) {
        privateKeyContent = fs.readFileSync(config.privateKeyPath, 'utf8');
    } else {
        log.error(`Private key file not found: ${config.privateKeyPath}`);
        process.exit(1);
    }
}

/**
 * Files and folders to scan for deployment
 */
const INCLUDE_PATHS = [
    'app',
    'bootstrap',
    'config',
    'database',
    'public',
    'resources/views',
    'routes',
    'artisan',
    'composer.json',
    'composer.lock',
    '.htaccess',
];

/**
 * Strict Exclusion Patterns (NEVER UPLOAD)
 */
const EXCLUDE_PATTERNS = [
    /^\.env/i, // .env, .env.deploy, .env.local, .env.production
    /^node_modules/i,
    /^vendor/i,
    /^\.git/i,
    /^storage/i,
    /^public\/hot$/i, // Dev server hot reload pointer (breaks production SSL)
    /^public\/storage$/i, // Local symlink
    /^bootstrap\/cache\/.*\.php$/i, // Local cached config/routes
    /^\.phpunit\.cache/i,
    /^\.vscode/i,
    /^\.idea/i,
    /^tests/i,
    /^scripts/i,
    /\.DS_Store$/i,
    /npm-debug\.log$/i,
    /yarn-error\.log$/i,
    /deploy-config\.json$/i,
];

function isExcluded(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    return EXCLUDE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getAllFiles(dir, base = '') {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const item of list) {
        const itemPath = path.join(dir, item);
        const relPath = path.join(base, item).replace(/\\/g, '/');

        if (isExcluded(relPath)) continue;

        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            results = results.concat(getAllFiles(itemPath, relPath));
        } else {
            results.push({
                localPath: itemPath,
                relPath: relPath,
                size: stat.size,
                mtime: stat.mtimeMs,
            });
        }
    }
    return results;
}

function getFilesToDeploy() {
    let files = [];
    for (const target of INCLUDE_PATHS) {
        const fullPath = path.join(ROOT_DIR, target);
        if (!fs.existsSync(fullPath)) continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files = files.concat(getAllFiles(fullPath, target));
        } else {
            if (!isExcluded(target)) {
                files.push({
                    localPath: fullPath,
                    relPath: target.replace(/\\/g, '/'),
                    size: stat.size,
                    mtime: stat.mtimeMs,
                });
            }
        }
    }
    return files;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function runBuild() {
    log.step(1, 'Building React/Inertia frontend with Vite...');
    try {
        execSync('npm run build', {
            cwd: ROOT_DIR,
            stdio: 'inherit',
        });
        log.success('Frontend build completed successfully!');
    } catch (err) {
        log.error('Frontend build failed. Deployment aborted.');
        process.exit(1);
    }
}

async function runRemoteArtisan() {
    log.step(3, 'Executing Laravel Production Optimization on Hostinger via SSH...');

    return new Promise((resolve, reject) => {
        const conn = new SshClient();

        conn.on('ready', () => {
            log.info('SSH connection established successfully.');

            const commands = [
                `cd "${config.remotePath}"`,
                `${config.phpBin} artisan optimize:clear`,
                `${config.phpBin} artisan config:cache`,
                `${config.phpBin} artisan route:cache`,
                `${config.phpBin} artisan view:cache`,
                `${config.phpBin} artisan storage:link || true`,
            ].join(' && ');

            log.info(`Running commands on server:\n  ${colors.dim}${commands}${colors.reset}\n`);

            conn.exec(commands, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }

                stream
                    .on('close', (code, signal) => {
                        conn.end();
                        if (code === 0) {
                            log.success('Laravel production cache optimization complete!');
                            resolve();
                        } else {
                            log.warn(
                                `Artisan commands exited with code ${code}. Please verify server logs if needed.`,
                            );
                            resolve();
                        }
                    })
                    .on('data', (data) => {
                        process.stdout.write(colors.cyan + data.toString() + colors.reset);
                    })
                    .stderr.on('data', (data) => {
                        process.stderr.write(colors.yellow + data.toString() + colors.reset);
                    });
            });
        });

        conn.on('error', (err) => {
            log.warn(`SSH connection failed: ${err.message}`);
            log.warn('Deployment files were uploaded, but artisan commands were skipped.');
            resolve();
        });

        const connectOptions = {
            host: config.host,
            port: config.port,
            username: config.username,
            readyTimeout: 20000,
        };

        if (privateKeyContent) {
            connectOptions.privateKey = privateKeyContent;
        } else {
            connectOptions.password = config.password;
        }

        conn.connect(connectOptions);
    });
}

async function uploadFiles(files) {
    log.step(2, `Connecting to Hostinger SFTP (${config.host}:${config.port})...`);

    if (IS_DRY_RUN) {
        log.warn('DRY RUN MODE: No files will be uploaded.');
        console.log(`\nFiles that would be uploaded (${files.length} items):`);
        let totalSize = 0;
        files.slice(0, 30).forEach((f) => {
            totalSize += f.size;
            console.log(`  + ${f.relPath} (${formatBytes(f.size)})`);
        });
        if (files.length > 30) {
            console.log(`  ... and ${files.length - 30} more files`);
        }
        totalSize = files.reduce((acc, f) => acc + f.size, 0);
        console.log(`\nTotal payload size: ${formatBytes(totalSize)}\n`);
        return;
    }

    const sftp = new SftpClient();
    const connectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 30000,
    };

    if (privateKeyContent) {
        connectConfig.privateKey = privateKeyContent;
    } else {
        connectConfig.password = config.password;
    }

    try {
        await sftp.connect(connectConfig);
        log.success(`Connected to Hostinger via SFTP as ${config.username}!`);
        log.info(`Target directory: ${config.remotePath}`);

        // Ensure remote root exists
        const rootExists = await sftp.exists(config.remotePath);
        if (!rootExists) {
            await sftp.mkdir(config.remotePath, true);
        }

        // Upload files
        let uploadedCount = 0;
        let totalBytes = files.reduce((sum, f) => sum + f.size, 0);
        let uploadedBytes = 0;

        console.log(
            `\nUploading ${files.length} files (${formatBytes(totalBytes)}) to Hostinger...\n`,
        );

        // 1. Create all unique remote directories upfront
        const uniqueDirs = Array.from(
            new Set(
                files.map((f) =>
                    path
                        .dirname(`${config.remotePath}/${f.relPath}`)
                        .replace(/\\/g, '/'),
                ),
            ),
        ).sort((a, b) => a.length - b.length);

        for (const dir of uniqueDirs) {
            const exists = await sftp.exists(dir);
            if (!exists) {
                await sftp.mkdir(dir, true);
            }
        }

        // 2. High-speed concurrent file upload
        const CONCURRENCY = 8;
        let fileIndex = 0;

        const worker = async () => {
            while (fileIndex < files.length) {
                const current = fileIndex++;
                if (current >= files.length) break;
                const file = files[current];
                const remoteFilePath = `${config.remotePath}/${file.relPath}`.replace(
                    /\\/g,
                    '/',
                );

                try {
                    await sftp.fastPut(file.localPath, remoteFilePath);
                    uploadedCount++;
                    uploadedBytes += file.size;

                    const percent =
                        Math.round((uploadedBytes / totalBytes) * 100) || 0;
                    process.stdout.write(
                        `\r[${percent}%] Uploaded ${uploadedCount}/${files.length} (${formatBytes(uploadedBytes)}): ${colors.dim}${file.relPath.slice(0, 45)}${colors.reset}`.padEnd(
                            80,
                        ),
                    );
                } catch (err) {
                    // Retry once on socket hiccup
                    try {
                        await sftp.fastPut(file.localPath, remoteFilePath);
                        uploadedCount++;
                        uploadedBytes += file.size;
                    } catch (retryErr) {
                        log.warn(`Failed to upload ${file.relPath}: ${retryErr.message}`);
                    }
                }
            }
        };

        const workers = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workers);


        console.log('\n');
        log.success(`All ${uploadedCount} files successfully uploaded to Hostinger!`);
    } catch (err) {
        log.error(`SFTP Upload Error: ${err.message}`);
        throw err;
    } finally {
        await sftp.end();
    }
}

async function startWatchMode() {
    const chokidar = await import('chokidar');
    log.info('Starting Watch Mode. Monitoring local files for changes...');
    console.log(
        `${colors.yellow}Press Ctrl+C at any time to stop file watching.${colors.reset}\n`,
    );

    let pendingFiles = new Set();
    let isDeploying = false;
    let debounceTimer = null;

    const watchDirs = [
        path.join(ROOT_DIR, 'app'),
        path.join(ROOT_DIR, 'config'),
        path.join(ROOT_DIR, 'database'),
        path.join(ROOT_DIR, 'resources'),
        path.join(ROOT_DIR, 'routes'),
        path.join(ROOT_DIR, 'public'),
    ];

    const watcher = chokidar.watch(watchDirs, {
        ignored: [
            /node_modules/,
            /\.git/,
            /storage/,
            /public\/hot/,
            /\.env/,
            /\.env\.deploy/,
            /bootstrap\/cache/,
        ],
        persistent: true,
        ignoreInitial: true,
    });

    const triggerSync = async () => {
        if (isDeploying) return;
        isDeploying = true;

        const filesToSync = Array.from(pendingFiles);
        pendingFiles.clear();

        log.info(
            `Detected changes in ${filesToSync.length} file(s). Preparing sync...`,
        );

        // Check if frontend files changed -> rebuild
        const hasFrontendChanges = filesToSync.some(
            (f) =>
                f.includes('resources/js') ||
                f.includes('resources/css') ||
                f.endsWith('.tsx') ||
                f.endsWith('.ts') ||
                f.endsWith('.jsx'),
        );

        if (hasFrontendChanges) {
            log.info('Frontend source changed. Running quick build...');
            try {
                execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
            } catch (err) {
                log.error('Build failed during watch mode. Skipping upload.');
                isDeploying = false;
                return;
            }
        }

        const deployFiles = getFilesToDeploy();
        try {
            await uploadFiles(deployFiles);
            log.success('Watch sync completed successfully!\n');
        } catch (err) {
            log.error(`Watch sync failed: ${err.message}\n`);
        } finally {
            isDeploying = false;
        }
    };

    watcher.on('all', (event, filePath) => {
        const rel = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
        if (isExcluded(rel)) return;

        pendingFiles.add(rel);
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(triggerSync, 2000);
    });
}

// Main Execution
async function main() {
    console.log(
        `\n${colors.bright}${colors.blue}======================================================${colors.reset}`,
    );
    console.log(
        `${colors.bright}${colors.blue}  DSAMS Hostinger Automated SFTP Deployment Tool     ${colors.reset}`,
    );
    console.log(
        `${colors.bright}${colors.blue}======================================================${colors.reset}\n`,
    );

    if (IS_ARTISAN_ONLY) {
        await runRemoteArtisan();
        return;
    }

    if (IS_WATCH) {
        await startWatchMode();
        return;
    }

    // 1. Build Frontend
    if (!IS_QUICK && !IS_DRY_RUN) {
        await runBuild();
    } else if (IS_QUICK) {
        log.info('Quick mode active: Skipping npm run build.');
    }

    // 2. Scan Files
    const filesToDeploy = getFilesToDeploy();
    log.info(`Scanned ${filesToDeploy.length} application files ready for deployment.`);

    // 3. Upload via SFTP
    await uploadFiles(filesToDeploy);

    // 4. Run Artisan Commands on Hostinger via SSH
    if (config.runArtisan && !IS_DRY_RUN) {
        await runRemoteArtisan();
    }

    console.log(
        `\n${colors.bright}${colors.green}======================================================${colors.reset}`,
    );
    console.log(
        `${colors.bright}${colors.green}  ✓ Deployment to Hostinger Completed Successfully!  ${colors.reset}`,
    );
    console.log(
        `${colors.bright}${colors.green}======================================================${colors.reset}\n`,
    );
}

main().catch((err) => {
    log.error(`Deployment failed: ${err.message}`);
    process.exit(1);
});
