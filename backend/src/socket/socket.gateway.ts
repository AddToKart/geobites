import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joinedRoom', data: room };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    console.log(`Client ${client.id} left room: ${room}`);
    return { event: 'leftRoom', data: room };
  }

  @SubscribeMessage('update_rider_location')
  handleRiderLocation(
    @MessageBody() payload: { orderId: string; lat: number; lng: number },
  ) {
    // Broadcast to the specific order room
    this.server.to(`order_${payload.orderId}`).emit('rider_location_updated', {
      orderId: payload.orderId,
      lat: payload.lat,
      lng: payload.lng,
      timestamp: new Date().toISOString(),
    });
  }

  // Utility method for other services to broadcast
  broadcastOrderStatus(orderId: string, status: string, vendorId: string, customerId: string) {
    this.server.to(`order_${orderId}`).emit('order_status_updated', { orderId, status });
    this.server.to(`vendor_${vendorId}`).emit('order_status_updated', { orderId, status });
    this.server.to(`customer_${customerId}`).emit('order_status_updated', { orderId, status });
    // Global broadcast for riders to see new ready orders, or use a specific 'riders' room
    this.server.emit('order_status_updated', { orderId, status });
  }

  broadcastNewOrder(vendorId: string, orderData: any) {
    this.server.to(`vendor_${vendorId}`).emit('new_order', orderData);
  }
}
