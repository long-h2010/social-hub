class CreateMessageDto {
  chat: string;
  sender: string;
  message: string;
  images?: string[];
  readed: string[];
}

export default CreateMessageDto;
