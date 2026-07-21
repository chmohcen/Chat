import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { User, Chat } from '../../models/chat.model';
import { Observable } from 'rxjs';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, UserSettingsModalComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  chats$: Observable<Chat[]>;
  filteredChats$: Observable<Chat[]>;
  searchQuery = '';
  selectedChatId = null;
  isSettingsOpen = false;
  currentUser: User | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {
    this.chats$ = this.chatService.chats$;
    this.filteredChats$ = this.chats$;
  }

  ngOnInit(): void {
    this.chatService.selectedChat$.subscribe(chat => {
      this.selectedChatId = chat?.id ?? null;
    });

    this.currentUser = this.authService.getCurrentUser();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.chatService.searchChats(query);
    
    this.chats$.subscribe(chats => {
      if (query.trim()) {
        this.filteredChats$ = new Observable(observer => {
          const filtered = chats.filter(chat =>
            chat.participants[0].name.toLowerCase().includes(query.toLowerCase())
          );
          observer.next(filtered);
          observer.complete();
        });
      } else {
        this.filteredChats$ = this.chats$;
      }
    });
  }

  selectChat(chat: Chat): void {
    this.chatService.selectChat(chat);
  }

  openSettingsModal(): void {
    this.isSettingsOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsOpen = false;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return '#31a24c';
      case 'away':
        return '#f39c12';
      case 'offline':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  }
}
