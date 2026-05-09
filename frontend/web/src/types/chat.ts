interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface LastMessage {
  sender: {
    id: string;
    name: string;
  };
  message: string;
  time: string;
}

export interface Chat {
  id: string;
  otherUser: string;
  displayName: string;
  displayAvatar: string;
  lastMessage: LastMessage;
  time: string;
  online: boolean;
  unread: number;
  members?: Member[];
  isGroup?: boolean;
  memberCount?: number;
}

export interface Message {
  id: string;
  user: Member;
  content: string;
  images: string[];
  time: string;
}
