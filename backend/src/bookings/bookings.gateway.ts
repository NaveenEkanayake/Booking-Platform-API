import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BookingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  sendBookingNotification(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
      console.log(`[WebSocket] Emitted event "${event}" with payload:`, payload);
    }
  }
}
