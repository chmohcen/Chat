import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { User, Chat } from '../../models/chat.model';
import { Observable } from 'rxjs';
import { UserSettingsModalComponent } from '../user-settings-modal/user-settings-modal.component';
import { UserSearchModalComponent } from '../user-search-modal/user-search-modal.component';
import { StatusColorPipe } from '../../pipes/status-color.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, UserSettingsModalComponent, UserSearchModalComponent, StatusColorPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  chats$: Observable<Chat[]>;
  filteredChats$: Observable<Chat[]>;
  isLoadingMoreChats$: Observable<boolean>;
  searchQuery = '';
  selectedChatId = null;
  isSettingsOpen = false;
  isUserSearchOpen = false;
  currentUser: User | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {
    this.chats$ = this.chatService.chats$;
    this.filteredChats$ = this.chats$;
    this.isLoadingMoreChats$ = this.chatService.isLoadingMoreChats$;
  }

  ngOnInit(): void {
    this.chatService.selectedChat$.subscribe(chat => {
      this.selectedChatId = chat?.id ?? null;
    });

    this.currentUser = this.authService.getCurrentUser();
  }

  onChatsScroll(event: Event): void {
    if (this.searchQuery.trim()) return;

    const target = event.target as HTMLElement;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
    if (nearBottom) {
      this.chatService.loadMoreConversations();
    }
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

  openUserSearchModal(): void {
    this.isUserSearchOpen = true;
  }

  closeUserSearchModal(): void {
    this.isUserSearchOpen = false;
  }

  onUserSelected(user: User): void {
    this.chatService.startChatWithUser(user);
    this.closeUserSearchModal();
  }

}
