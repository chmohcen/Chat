import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/chat.model';
import { environment } from '../../environments/environment';

export interface MessageDto {
  id: number;
  sender: number;
  receiver: number;
  text: string;
  is_seen: boolean;
  created_at: string;
}

export interface ConversationDto {
  user: User;
  last_message: {
    id: number;
    text: string;
    created_at: string;
    sender: number;
    is_seen: boolean;
  };
  unread_count: number;
}

export interface ConversationsPageDto {
  results: ConversationDto[];
  has_more: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private http: HttpClient) {}

  getConversations(offset: number, limit: number): Observable<ConversationsPageDto> {
    return this.http.get<ConversationsPageDto>(`${environment.apiEndpoint}/messages/conversations/`, {
      params: { offset, limit }
    });
  }

  getMessages(withUserId: string): Observable<MessageDto[]> {
    return this.http.get<MessageDto[]>(`${environment.apiEndpoint}/messages/`, {
      params: { with: withUserId }
    });
  }

  sendMessage(receiverId: string, text: string): Observable<MessageDto> {
    return this.http.post<MessageDto>(`${environment.apiEndpoint}/messages/`, {
      receiver: receiverId,
      text
    });
  }
}