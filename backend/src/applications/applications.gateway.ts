import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ApplicationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ApplicationsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinJob')
  handleJoinJob(@MessageBody() jobId: string, @ConnectedSocket() client: Socket) {
    client.join(`job-${jobId}`);
    this.logger.log(`Client ${client.id} joined job room: job-${jobId}`);
  }

  @SubscribeMessage('leaveJob')
  handleLeaveJob(@MessageBody() jobId: string, @ConnectedSocket() client: Socket) {
    client.leave(`job-${jobId}`);
    this.logger.log(`Client ${client.id} left job room: job-${jobId}`);
  }

  // Method to emit application updates to all clients watching a job
  emitApplicationUpdate(jobId: string, application: any) {
    this.server.to(`job-${jobId}`).emit('applicationUpdated', application);
    this.logger.log(`Emitted application update for job: ${jobId}`);
  }

  // Method to emit job completion updates
  emitJobCompleted(jobId: string, jobData: any) {
    this.server.to(`job-${jobId}`).emit('jobCompleted', jobData);
    this.logger.log(`Emitted job completion for job: ${jobId}`);
  }
}
