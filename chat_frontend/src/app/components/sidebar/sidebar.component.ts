import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { User, Chat } from '../../models/chat.model';
import { Observable } from 'rxjs';

interface SettingsForm {
  name: string;
  email: string;
  password: string;
  avatar: string;
  status: User['status'];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  currentUser$: Observable<User>;
  chats$: Observable<Chat[]>;
  filteredChats$: Observable<Chat[]>;
  searchQuery: string = '';
  selectedChatId: string | null = null;
  isSettingsOpen = false;
  currentUser: User | null = null;
  settingsForm: SettingsForm = {
    name: '',
    email: '',
    password: '',
    avatar: '',
    status: 'online'
  };
  statusOptions: Array<{ value: User['status']; label: string }> = [
    { value: 'online', label: 'Active' },
    { value: 'away', label: 'Away' },
    { value: 'offline', label: 'Offline' }
  ];

  constructor(private chatService: ChatService) {
    this.currentUser$ = this.chatService.currentUser$;
    this.chats$ = this.chatService.chats$;
    this.filteredChats$ = this.chats$;
  }

  ngOnInit(): void {
    this.chatService.selectedChat$.subscribe(chat => {
      this.selectedChatId = chat?.id ?? null;
    });

    this.chatService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.isSettingsOpen) {
        this.resetSettingsForm(user);
      }
    });
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
    if (this.currentUser) {
      this.resetSettingsForm(this.currentUser);
    }
    this.isSettingsOpen = true;
  }

  closeSettingsModal(): void {
    this.isSettingsOpen = false;
  }

  saveSettings(): void {
    if (!this.currentUser) {
      return;
    }

    const updatedUser: User = {
      ...this.currentUser,
      name: this.settingsForm.name.trim() || this.currentUser.name,
      avatar: this.settingsForm.avatar.trim() || this.currentUser.avatar,
      status: this.settingsForm.status,
      email: this.settingsForm.email.trim() || this.currentUser.email || '',
      password: this.settingsForm.password.trim() || this.currentUser.password || ''
    };

    this.chatService.updateCurrentUser(updatedUser);
    this.currentUser = updatedUser;
    this.closeSettingsModal();
  }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.settingsForm.avatar = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }

  private resetSettingsForm(user: User | null): void {
    this.settingsForm = {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: user?.password ?? '',
      avatar: user?.avatar ?? '',
      status: user?.status ?? 'online'
    };
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
