import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User, Chat, Message } from '../models/chat.model';
import { AuthService } from './auth.service';
import { MessageService, ConversationDto, MessageDto } from './message.service';

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

  private hasMoreChatsSubject = new BehaviorSubject<boolean>(false);
  hasMoreChats$ = this.hasMoreChatsSubject.asObservable();

  private isLoadingMoreChatsSubject = new BehaviorSubject<boolean>(false);
  isLoadingMoreChats$ = this.isLoadingMoreChatsSubject.asObservable();

  private readonly conversationsPageSize = 20;
  private conversationsOffset = 0;
  private isLoadingMoreChats = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {
    this.loadConversations();
  }

  selectChat(chat: Chat): void {
    this.selectedChatSubject.next(chat);

    this.messageService.getMessages(chat.participants[0].id).subscribe(dtos => {
      this.messagesSubject.next(dtos.map(dto => this.toMessage(dto, chat)));
    });

    this.markChatAsRead(chat.id);
  }

  startChatWithUser(user: User): void {
    const normalizedUser = this.toUser(user);

    const existing = this.chatsSubject.value.find(chat => chat.participants[0].id === normalizedUser.id);
    if (existing) {
      this.selectChat(existing);
      return;
    }

    const newChat: Chat = {
      id: normalizedUser.id,
      participants: [normalizedUser],
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      currentUser: this.authService.getCurrentUser()
    };

    this.selectChat(newChat);
  }

  sendMessage(content: string): void {
    const chat = this.selectedChatSubject.value;
    if (!chat) return;

    this.messageService.sendMessage(chat.participants[0].id, content).subscribe(dto => {
      const message = this.toMessage(dto, chat);
      this.messagesSubject.next([...this.messagesSubject.value, message]);

      const updatedChat: Chat = {
        ...chat,
        lastMessage: message.content,
        lastMessageTime: message.timestamp
      };

      const otherChats = this.chatsSubject.value.filter(c => c.id !== chat.id);
      this.chatsSubject.next([updatedChat, ...otherChats]);
      this.selectedChatSubject.next(updatedChat);
    });
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

  loadMoreConversations(): void {
    if (this.isLoadingMoreChats || !this.hasMoreChatsSubject.value) return;

    this.isLoadingMoreChats = true;
    this.isLoadingMoreChatsSubject.next(true);
    this.messageService.getConversations(this.conversationsOffset, this.conversationsPageSize).subscribe(page => {
      const newChats = page.results.map(conversation => this.toChat(conversation));
      this.chatsSubject.next([...this.chatsSubject.value, ...newChats]);
      this.conversationsOffset += page.results.length;
      this.hasMoreChatsSubject.next(page.has_more);
      this.isLoadingMoreChats = false;
      this.isLoadingMoreChatsSubject.next(false);
    });
  }

  private loadConversations(): void {
    this.messageService.getConversations(0, this.conversationsPageSize).subscribe(page => {
      const chats = page.results.map(conversation => this.toChat(conversation));
      this.chatsSubject.next(chats);
      this.conversationsOffset = page.results.length;
      this.hasMoreChatsSubject.next(page.has_more);

      if (chats.length > 0 && !this.selectedChatSubject.value) {
        this.selectChat(chats[0]);
      }
    });
  }

  private toChat(conversation: ConversationDto): Chat {
    const participant = this.toUser(conversation.user);

    return {
      id: participant.id,
      participants: [participant],
      lastMessage: conversation.last_message.text,
      lastMessageTime: new Date(conversation.last_message.created_at),
      unreadCount: conversation.unread_count,
      currentUser: this.authService.getCurrentUser()
    };
  }

  private toUser(user: User): User {
    return {
      ...user,
      id: String(user.id),
      picture: user.final_picture || user.picture
    };
  }

  private toMessage(dto: MessageDto, chat: Chat): Message {
    const currentUser = this.authService.getCurrentUser();
    const isOwn = String(dto.sender) === String(currentUser.id);

    return {
      id: String(dto.id),
      chatId: chat.id,
      sender: isOwn ? currentUser : chat.participants[0],
      content: dto.text,
      timestamp: new Date(dto.created_at),
      isRead: dto.is_seen,
      isOwn
    };
  }
}
