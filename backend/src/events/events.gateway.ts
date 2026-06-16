import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Central Socket.IO gateway.
 *
 * Rooms convention:
 *   customer_<userId>  – customer-specific updates
 *   seller_<userId>    – seller-specific updates
 *   rider_<userId>     – rider-specific updates
 *   order_<orderId>    – per-order tracking room
 *
 * Events emitted TO clients:
 *   order_status_updated   { orderId, status, updatedAt }
 *   rider_location_updated { orderId, lat, lng }
 *   new_order              { order }
 *   notification           { id, title, message, type, referenceId }
 */
@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      const lanIp = process.env.LAN_IP || '192.168.100.116';
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
        origin,
      );
      const isEmulator = /^https?:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);
      const isLanIp =
        origin.startsWith(`http://${lanIp}`) ||
        origin.startsWith(`https://${lanIp}`);
      return callback(null, isLocalhost || isEmulator || isLanIp);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('Socket.IO gateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Client joins a room (e.g. "customer_<id>", "order_<id>") */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(room);
    this.logger.log(`${client.id} joined room: ${room}`);
  }

  /** Client leaves a room */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(room);
    this.logger.log(`${client.id} left room: ${room}`);
  }

  /** Rider broadcasts their live location */
  @SubscribeMessage('update_rider_location')
  handleRiderLocation(
    @MessageBody() data: { orderId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Rider location update for order ${data.orderId}: (${data.lat}, ${data.lng})`,
    );
    // Broadcast to the order-specific room (customer + seller listening)
    client.to(`order_${data.orderId}`).emit('rider_location_updated', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Server-side emit helpers — called by NestJS services to push events
  // ─────────────────────────────────────────────────────────────────────────

  /** Notify everyone in a room that an order's status changed */
  emitOrderStatusUpdated(
    room: string,
    payload: { orderId: string; status: string; updatedAt: string },
  ) {
    this.server.to(room).emit('order_status_updated', payload);
  }

  /** Push a new-order event to a seller's room */
  emitNewOrder(sellerUserId: string, order: unknown) {
    this.server.to(`seller_${sellerUserId}`).emit('new_order', { order });
  }

  /** Push a notification to a specific user's room */
  emitNotification(
    userId: string,
    notification: {
      id?: string;
      title: string;
      message: string;
      type: string;
      referenceId?: string;
    },
  ) {
    // Try all three role rooms — the client will only be in one of them
    ['customer', 'seller', 'rider'].forEach((role) => {
      this.server.to(`${role}_${userId}`).emit('notification', notification);
    });
  }
}
