import { io, Socket } from 'socket.io-client';
import { ApplicationDTO } from './applicationService';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket | null {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.warn('WebSocket connection error:', error);
        this.isConnected = false;
      });

      return this.socket;
    } catch (error) {
      console.warn('Failed to initialize WebSocket:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinJob(jobId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinJob', jobId);
    }
  }

  leaveJob(jobId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveJob', jobId);
    }
  }

  onApplicationUpdate(callback: (application: ApplicationDTO) => void) {
    if (this.socket) {
      this.socket.on('applicationUpdated', callback);
    }
  }

  offApplicationUpdate(callback: (application: ApplicationDTO) => void) {
    if (this.socket) {
      this.socket.off('applicationUpdated', callback);
    }
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
