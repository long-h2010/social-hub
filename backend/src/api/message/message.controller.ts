import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MessageService } from './message.service';
import SendMessageDto from './dto/send-message.dto';
import { AuthGuard } from 'src/common/guard/auth-guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async sendMessage(
    @Request() req: any,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user.id;
    const chatId = body.chatId;
    const data: SendMessageDto = {
      sendTo: body.sendTo,
      message: body.message,
    };

    return await this.messageService.sendMessage(userId, chatId, data);
  }

  @Post('send-images')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async sendImages(
    @Body() body: { chatId: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.messageService.sendWithImages(body.chatId, files);
  }

  @Get(':chatId')
  @UseGuards(AuthGuard)
  async findMessageByChat(@Param('chatId') chatId: string) {
    return await this.messageService.findMessageByChat(chatId);
  }

  @Put('mask-readed/:chatId')
  @UseGuards(AuthGuard)
  async maskAsRead(@Request() req: any, @Param('chatId') chatId: string) {
    const userId = req.user.id;
    return await this.messageService.maskAsRead(userId, chatId);
  }
}
