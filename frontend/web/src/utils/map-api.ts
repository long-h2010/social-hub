import type { Chat, Message } from '../types/chat';
import type { Comment } from '../types/comment';
import type { Post } from '../types/post';

export const mapUserApi = (user: any) => {
  return {
    id: user._id,
    ...user,
  };
};

export const mapPostApi = (post: any): Post => {
  return {
    id: post._id,
    author: post.author.name,
    avatar: post.author.avatar,
    time: post.createdAt,
    content: post.content,
    images: post.images,
    likes: post.likesCount,
    comments: post.comments,
    liked: post.liked || false,
    isHot: post.isHot || false,
  };
};

export const mapCommentApi = (cmt: any): Comment => {
  return {
    id: cmt._id,
    owner: {
      id: cmt.owner._id,
      name: cmt.owner.name,
      avatar: cmt.owner.avatar,
    },
    content: cmt.content,
    likeCounting: cmt.likeCounting,
    replyCounting: cmt.replyCounting,
    replies: cmt.replies,
    liked: cmt.liked,
    createdAt: cmt.createdAt,
  };
};

export const mapChatApi = (chat: any): Chat => ({
  id: chat._id,
  otherUser: chat.otherUser,
  displayName: chat.displayName,
  displayAvatar: chat.displayAvatar,
  lastMessage: {
    sender: {
      id: chat.lastMessage?.sender._id,
      name: chat.lastMessage?.sender.name,
    },
    message: chat.lastMessage?.message,
    time: chat.lastMessage?.createdAt,
  },
  time: chat.updatedAt,
  online: false,
  unread: chat.unread,
  members: chat.members.map((m: any) => ({
    id: m._id,
    name: m.name,
    avatar: m.avatar,
  })),
  isGroup: chat.members.length > 2,
  memberCount: chat.members.length,
});

export const mapMessageApi = (msg: any): Message => ({
  id: msg._id,
  user: {
    id: msg.sender?._id,
    name: msg.sender?.name,
    avatar: msg.sender?.avatar,
  },
  content: msg.message,
  images: msg.images,
  time: msg.createdAt,
});
