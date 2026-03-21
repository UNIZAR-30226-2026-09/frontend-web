import { useGameStore } from '../store/gameStore';

class SocketService {
    private socket: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private url: string;

    // Configuración de reconexión
    private maxRetries = 5;
    private retryCount = 0;
    private baseDelay = 1000; // 1 segundo inicial

    constructor(url: string) {
        this.url = url;
    }

    public connect() {
        // Si ya está conectado o conectándose, no hacemos nada
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`[WebSocket] Intentando conectar a ${this.url}...`);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('[WebSocket] Conectado con éxito.');
            this.retryCount = 0; // Reseteamos los intentos
            useGameStore.getState().setSocketConnection(true);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                useGameStore.getState().procesarMensajeSocket(data);
            } catch (error) {
                console.error('[WebSocket] Error al parsear el mensaje entrante:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.warn('[WebSocket] Conexión cerrada. Código:', event.code);
            useGameStore.getState().setSocketConnection(false);

            // Si no fue un cierre limpio (por ejemplo que se caiga el servidor), intentamos reconectar
            if (!event.wasClean) {
                this.handleReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('[WebSocket] Error de red detectado:', error);
            this.socket?.close(); // Forzamos el cierre para activar el onclose y reconectar
        };
    }

    private handleReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            // Backoff exponencial: 1s, 2s, 4s, 8s, 16s... hasta 10 segundos
            const delay = Math.min(this.baseDelay * Math.pow(2, this.retryCount - 1), 10000);

            console.log(`[WebSocket] Intento de reconexión ${this.retryCount}/${this.maxRetries} en ${delay}ms...`);

            this.reconnectTimer = setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('[WebSocket] Límite de intentos de reconexión superado. Conexión perdida.');
        }
    }

    public disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            console.log('[WebSocket] Desconectando manualmente...');
            this.socket.close(1000, "Desconexión intencionada");
            this.socket = null;
        }
    }

    // Método para enviar datos al backend
    public send(type: string, payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            this.socket.send(message);
        } else {
            console.error('[WebSocket] No se puede enviar el mensaje, el socket no está abierto. Tipo:', type);
        }
    }
}

export const socketService = new SocketService('ws://localhost:8000/ws');