import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, Chat, Message } from '../models/chat.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chatsSubject.asObservable();

  private selectedChatSubject = new BehaviorSubject<Chat | null>(null);
  selectedChat$ = this.selectedChatSubject.asObservable();

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  constructor(private authService: AuthService) {
    this.chatsSubject.next(this.generateMockChats());
    this.selectChat(this.chatsSubject.value[0]);
  }

  selectChat(chat: Chat): void {
    this.selectedChatSubject.next(chat);
    this.messagesSubject.next(this.generateMockMessages(chat.id));
    this.markChatAsRead(chat.id);
  }

  sendMessage(content: string): void {
    const chat = this.selectedChatSubject.value;
    if (!chat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      sender: this.authService.getCurrentUser(),
      content,
      timestamp: new Date(),
      isRead: true,
      isOwn: true
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, newMessage]);

    // Simulate reply
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chat.id,
        sender: chat.participants[0],
        content: this.generateReply(),
        timestamp: new Date(),
        isRead: false,
        isOwn: false
      };
      this.messagesSubject.next([...this.messagesSubject.value, reply]);
    }, 1000);

    // Update chat list
    const updatedChat = {
      ...chat,
      lastMessage: content,
      lastMessageTime: new Date()
    };
    const chats = this.chatsSubject.value.map(c => c.id === chat.id ? updatedChat : c);
    this.chatsSubject.next(chats);
    this.selectedChatSubject.next(updatedChat);
  }

  searchChats(query: string): void {
    this.searchQuerySubject.next(query);
  }

  markChatAsRead(chatId: string): void {
    const chats = this.chatsSubject.value.map(chat =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    this.chatsSubject.next(chats);
  }

  private generateMockChats(): Chat[] {
    const users = [
      {
        id: '2',
        name: 'Sarah Johnson',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        status: 'online' as const
      },
      {
        id: '3',
        name: 'Mike Chen',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        status: 'offline' as const
      },
      {
        id: '4',
        name: 'Emma Davis',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
        status: 'away' as const
      },
      {
        id: '5',
        name: 'Alex Wilson',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        status: 'online' as const
      },
      {
        id: '6',
        name: 'Jessica Brown',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
        status: 'online' as const
      }
    ];

    return users.map((user, index) => ({
      id: `chat-${index + 1}`,
      participants: [user],
      lastMessage: `Hey! How are you doing? ${index > 0 ? 'Last message...' : ''}`,
      lastMessageTime: new Date(Date.now() - index * 3600000),
      unreadCount: index === 0 ? 0 : Math.floor(Math.random() * 3),
      currentUser: this.authService.getCurrentUser()
    }));
  }

  private generateMockMessages(chatId: string): Message[] {
    const sampleMessages = [
      'Hey! How are you doing?',
      'I was just thinking about our project',
      'Have you checked the latest updates?',
      'Let\'s catch up soon!',
      'That sounds great!'
    ];

    const messages: Message[] = [];
    const users: User[] = [
      {
        id: '1',
        name: 'You',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
        status: 'online'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        status: 'online'
      }
    ];

    for (let i = 0; i < 8; i++) {
      messages.push({
        id: `msg-${i}`,
        chatId,
        sender: users[i % 2],
        content: sampleMessages[i % sampleMessages.length],
        timestamp: new Date(Date.now() - (8 - i) * 120000),
        isRead: true,
        isOwn: i % 2 === 0
      });
    }

    return messages;
  }

  private generateReply(): string {
    const replies = [
      'That\'s awesome! 😊',
      'Totally agree with you!',
      'Sounds good to me',
      'Let\'s do it!',
      'I like that idea',
      'Thanks for letting me know!'
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
}
