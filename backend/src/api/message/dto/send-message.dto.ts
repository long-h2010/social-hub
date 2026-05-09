import { IsNotEmpty } from 'class-validator';

class SendMessageDto {
  sendTo?: string;

  @IsNotEmpty()
  message: string;

  images?: string[];
}

export default SendMessageDto;
