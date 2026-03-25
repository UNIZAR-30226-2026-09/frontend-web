// src/services/socketService.ts
import { useGameStore } from '../store/gameStore';

const WS_BASE_URL: string = (import.meta as any).env?.VITE_WS_URL ?? 'ws://localhost:8000';

class SocketService {
    private socket: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private currentUrl: string = '';

    private maxRetries = 5;
    private retryCount = 0;
    private baseDelay = 1000;

    /** Conecta al WS global de la partida activa. */
    public connect(url?: string) {
        const targetUrl = url || `${WS_BASE_URL}/ws`;

        // No reconectar si ya apuntamos al mismo socket abierto
        if (
            this.socket &&
            this.currentUrl === targetUrl &&
            (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        // Cerrar conexión anterior si la URL ha cambiado
        if (this.socket) {
            this.socket.onclose = null; // Evitar reconexión involuntaria
            this.socket.close(1000, 'Reconectando a nueva sala');
            this.socket = null;
        }

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
        const url = `${WS_BASE_URL}/ws/${partidaId}?token=${token}`;
        this.connect(url);
    }

    private _openSocket() {
        console.log(`[WebSocket] Conectando a ${this.currentUrl}...`);
        this.socket = new WebSocket(this.currentUrl);

        this.socket.onopen = () => {
            console.log('[WebSocket] Conectado con éxito.');
            this.retryCount = 0;
            useGameStore.getState().setSocketConnection(true);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                useGameStore.getState().procesarMensajeSocket(data);
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
}

export const socketService = new SocketService();