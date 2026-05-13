import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from 'src/api/message/message.service';
import { generateAgoraToken } from 'src/common/utils/generate-agora-token';

@WebSocketGateway({
  cors: { origin: [process.env.WEB_URL] },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private users = new Map<string, string>();

  constructor(private readonly msgService: MessageService) {}

  async handleConnection(client: Socket) {
    const userId = client.data.userId;
    this.users.set(userId, client.id);

    client.join(`user:${userId}`);
    client.emit('online-list', Array.from(this.users.keys()));
    this.server.emit('user-online', { userId });

    console.log(`User ${userId} connected`);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.users.delete(userId);

    client.leave(`user:${userId}`);
    this.server.emit('user-offline', { userId });

    console.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('join-all-chats')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody('chatIds') chatIds: string[],
  ) {
    chatIds.forEach((id) => client.join(`chat:${id}`));
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const userId = client.data.userId;
    const sendMsgData = {
      sendTo: body.sendTo,
      message: body.message,
      images: body.images,
    };

    const message = await this.msgService.sendMessage(
      userId,
      body.chatId,
      sendMsgData,
    );

    this.server
      .to(`chat:${message.chat.toString()}`)
      .emit('new-message', message);
  }

  @SubscribeMessage('calling')
  async handleCalling(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const uid = Math.floor(Math.random() * 100000000);
    const tokenAgora = generateAgoraToken(body.chatId, uid);

    client.join(`call:${body.chatId}`);

    this.server.to(`user:${body.caller.id}`).emit('calling', {
      caller: body.caller,
      channel: body.chatId,
      token: tokenAgora,
      uid: uid,
    });

    this.server
      .to(`user:${body.callee}`)
      .emit('ringing', { channel: body.chatId, caller: body.caller });
  }

  @SubscribeMessage('accept-call')
  async handleAcceptCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const uid = Math.floor(Math.random() * 100000000);
    const tokenAgora = generateAgoraToken(body.channel, uid);

    client.join(`call:${body.channel}`);

    const socketId = this.users.get(body.callee);

    if (!socketId) {
      console.log('User offline');
      return;
    }

    const targetSocket = this.server.sockets.sockets.get(socketId);

    if (!targetSocket) {
      console.log('Socket not found');
      return;
    }

    targetSocket.timeout(10000).emit(
      'accept-call',
      {
        caller: body.callee,
        channel: body.channel,
        token: tokenAgora,
        uid,
      },
      (err, response) => {
        if (err) {
          console.log('ACK failed', err);
          return;
        }

        console.log('ACK success', response);

        this.server.to(`user:${body.caller.id}`).emit('callee-accept');
      },
    );
  }

  @SubscribeMessage('end-call')
  async handleEndCall(@MessageBody() body: any) {
    if (body.user) this.server.to(`user:${body.user}`).emit('call-ended');
    this.server.to(`call:${body.channel}`).emit('call-ended');
  }
}
