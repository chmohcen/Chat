export interface User {
  id: string;
  name: string;
  picture: string;
  final_picture?: string;
  status: 'online' | 'offline' | 'away';
  email?: string;
  password?: string;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  currentUser: User;
}

export interface Message {
  id: string;
  chatId: string;
  sender: User;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isOwn: boolean;
}
