// src/services/socketService.ts
import { useGameStore } from '../store/gameStore';

const WS_BASE_URL: string = (import.meta as any).env?.VITE_WS_URL ?? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`;

class SocketService {
    private socket: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private currentUrl: string = '';

    private maxRetries = 5;
    private retryCount = 0;
    private baseDelay = 1000;

    // ── WebSocket global de presencia (independiente del de partida) ──────────
    private globalSocket: WebSocket | null = null;

    /**
     * Abre la conexión de presencia global tras el login.
     * El backend detecta el `onopen` y marca al usuario como CONECTADO,
     * y el `onclose` lo marca como DESCONECTADO.
     * URL: ws://<host>/ws/global/<username>
     */
    public connectToGlobal(username: string, token?: string) {
        if (this.globalSocket && this.globalSocket.readyState === WebSocket.OPEN) return;

        // Intentamos primero sin token (igual que connectToPartida).
        // Si el backend lo requiere como header en el handshake, esto lo deberá configurar el backend.
        const url = `${WS_BASE_URL}/api/v1/global/${username}`;
        console.log(`[WS Global] Conectando presencia: ${url}`);
        this.globalSocket = new WebSocket(url);

        this.globalSocket.onopen = () => {
            console.log('[WS Global] ✅ Presencia online establecida.');
        };

        this.globalSocket.onclose = (event) => {
            if (event.code !== 1000) {
                console.warn('[WS Global] Presencia cerrada inesperadamente. Código:', event.code,
                    '— ¿Está el endpoint /ws/global/{username} activo en el backend?');
            }
            this.globalSocket = null;
        };

        this.globalSocket.onerror = () => {
            // Silenciamos el error de red — el backend aún no tiene el endpoint activo
            console.warn('[WS Global] No se pudo conectar la presencia. El endpoint puede no estar disponible todavía.');
        };
    }

    /** Cierra la conexión de presencia global (al hacer logout). */
    public disconnectGlobal() {
        if (this.globalSocket) {
            console.log('[WS Global] Cerrando presencia...');
            this.globalSocket.onclose = null;
            this.globalSocket.close(1000, 'Logout');
            this.globalSocket = null;
        }
    }

    /** Conecta al WS global de la partida activa. */
    public connect(url?: string) {
        const targetUrl = url || `${WS_BASE_URL}/ws`;

        // Idempotencia absoluta: si ya hay un socket vivo, se ignora todo.
        // Esto previene que Strict Mode cierre e intente abrir de 0 muy rápido
        if (this.socket) return;

        this.currentUrl = targetUrl;
        this.retryCount = 0;
        this._openSocket();
    }

    /**
     * Conecta al canal WebSocket de un lobby específico.
     * @param {number|string} partidaId - ID de la partida.
     * @param {string} token - JWT del usuario autenticado.
     */
    public connectToLobby(partidaId: number | string, token: string) {
        const url = `${WS_BASE_URL}/api/v1/ws/${partidaId}?token=${token}`;
        this.connect(url);
    }

    /**
     * Conecta al canal WebSocket de una partida/lobby usando el username como identificador.
     * URL esperada por el backend: /ws/{id}/{username}
     * @param {number|string} partidaId - ID de la partida.
     * @param {string} username - Nombre de usuario del jugador autenticado.
     */
    public connectToPartida(partidaId: number | string, username: string) {
        const url = `${WS_BASE_URL}/api/v1/ws/${partidaId}/${username}`;
        this.connect(url);
    }

    private _openSocket() {
        console.log(`[WebSocket] Conectando a ${this.currentUrl}...`);
        this.socket = new WebSocket(this.currentUrl);

        this.socket.onopen = () => {
            console.log('[WebSocket] Conectado con éxito.');
            this.retryCount = 0;
            useGameStore.getState().setSocketConnection(true);

            // Sincronizar estado al reconectar para recuperar cambios perdidos durante el downtime
            useGameStore.getState().sincronizarEstadoPartida();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                useGameStore.getState().actualizarDesdeSocket(data);
            } catch (error) {
                console.error('[WebSocket] Error al parsear el mensaje:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.warn('[WebSocket] Conexión cerrada. Código:', event.code);
            useGameStore.getState().setSocketConnection(false);

            if (!event.wasClean) {
                this._handleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('[WebSocket] Error de red:', error);
            this.socket?.close();
        };
    }

    private _handleReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(this.baseDelay * Math.pow(2, this.retryCount - 1), 10000);
            console.log(`[WebSocket] Reconexión ${this.retryCount}/${this.maxRetries} en ${delay}ms...`);
            this.reconnectTimer = setTimeout(() => this._openSocket(), delay);
        } else {
            console.error('[WebSocket] Límite de reconexión superado.');
        }
    }

    public disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            console.log('[WebSocket] Desconectando manualmente...');
            this.socket.onclose = null;
            this.socket.close(1000, 'Desconexión intencionada');
            this.socket = null;
        }

        useGameStore.getState().setSocketConnection(false);
    }

    /** Envía un mensaje tipado al servidor. */
    public send(type: string, payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        } else {
            console.error('[WebSocket] Socket no disponible. Tipo:', type);
        }
    }

    public sendRaw(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('[WebSocket] Socket no disponible');
        }
    }
}

export const socketService = new SocketService();