import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export interface SocketUserAuth {
    userId?: string | number | null;
    role?: string | null;
    token?: string | null;
}

/**
 * Check if the real-time WebSocket connection is enabled
 */
export function isSocketEnabled(): boolean {
    const customUrl = (import.meta as any).env?.VITE_SOCKET_SERVER_URL;
    if (customUrl === 'false' || customUrl === 'none' || customUrl === 'disabled' || customUrl === '0') {
        return false;
    }
    return true;
}

/**
 * Get or initialize the Socket.IO client instance (Singleton)
 */
export function getSocketInstance(auth?: SocketUserAuth): Socket | null {
    if (!isSocketEnabled()) {
        return null;
    }

    if (socket && socket.connected) {
        return socket;
    }

    const customUrl = (import.meta as any).env?.VITE_SOCKET_SERVER_URL;
    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.endsWith('.test'));

    // If on a live remote domain and no explicit socket URL is provided,
    // default to same origin (for reverse proxy) or skip raw port 3001
    const socketUrl =
        customUrl ||
        (isLocalhost
            ? `${window.location.protocol}//${window.location.hostname}:3001`
            : window.location.origin);

    if (!socket) {
        try {
            socket = io(socketUrl, {
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 5000,
                reconnectionDelayMax: 15000,
                timeout: 10000,
                transports: ['websocket', 'polling'],
                auth: auth || {},
            });

            socket.on('connect', () => {
                console.log('[Socket.IO Client] Connected to real-time server:', socket?.id);
            });

            socket.on('disconnect', (reason) => {
                if (reason !== 'io client disconnect') {
                    // Graceful fallback to HTTP polling
                }
            });

            socket.on('connect_error', () => {
                // Silently fall back to periodic HTTP polling without console spam
            });
        } catch {
            return null;
        }
    } else if (auth) {
        // Update auth credentials if re-initializing
        socket.auth = auth;
    }

    return socket;
}

/**
 * Connect the socket with authenticated user credentials
 */
export function connectSocket(userId?: string | number | null, role?: string | null): Socket | null {
    const instance = getSocketInstance({ userId, role });
    if (!instance) return null;

    if (!instance.connected) {
        instance.auth = { userId, role };
        try {
            instance.connect();
        } catch {
            // Fail gracefully
        }
    }

    return instance;
}

/**
 * Cleanly disconnect and tear down socket
 */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('[Socket.IO Client] Socket connection closed and cleared.');
    }
}
