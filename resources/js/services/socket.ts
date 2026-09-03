import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export interface SocketUserAuth {
    userId?: string | number | null;
    role?: string | null;
    token?: string | null;
}

/**
 * Get or initialize the Socket.IO client instance (Singleton)
 */
export function getSocketInstance(auth?: SocketUserAuth): Socket {
    if (socket && socket.connected) {
        return socket;
    }

    // Determine the socket server URL (defaults to port 3001 on current host)
    const socketUrl =
        (import.meta as any).env?.VITE_SOCKET_SERVER_URL ||
        `${window.location.protocol}//${window.location.hostname}:3001`;

    if (!socket) {
        socket = io(socketUrl, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            transports: ['websocket', 'polling'],
            auth: auth || {},
        });

        socket.on('connect', () => {
            console.log('[Socket.IO Client] Connected to real-time server:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket.IO Client] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.warn('[Socket.IO Client] Connection Error (Is Node.js socket server running on port 3001?):', error.message);
        });
    } else if (auth) {
        // Update auth credentials if re-initializing
        socket.auth = auth;
    }

    return socket;
}

/**
 * Connect the socket with authenticated user credentials
 */
export function connectSocket(userId?: string | number | null, role?: string | null): Socket {
    const instance = getSocketInstance({ userId, role });

    if (!instance.connected) {
        instance.auth = { userId, role };
        instance.connect();
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
