import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { User } from '../../models/chat.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search-modal.component.html',
  styleUrl: './user-search-modal.component.scss'
})
export class UserSearchModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  searchQuery = '';
  users: User[] = [];
  isLoading = false;
  hasSearched = false;
  errorMessage = '';

  private searchInput$ = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(private userService: UserService) {
    this.searchSubscription = this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmedQuery = query.trim();
          if (!trimmedQuery) {
            this.users = [];
            this.hasSearched = false;
            this.isLoading = false;
            this.errorMessage = '';
            return of([]);
          }

          this.isLoading = true;
          this.errorMessage = '';
          return this.userService.searchUsers(trimmedQuery);
        })
      )
      .subscribe({
        next: (users) => {
          if (Array.isArray(users)) {
            this.users = users;
            this.hasSearched = true;
            this.isLoading = false;
          }
        },
        error: () => {
          this.users = [];
          this.hasSearched = true;
          this.isLoading = false;
          this.errorMessage = 'Unable to search users right now.';
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && !this.isOpen) {
      this.resetSearch();
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  close(): void {
    this.resetSearch();
    this.closed.emit();
  }

  onSearchInput(): void {
    this.searchInput$.next(this.searchQuery);
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

  private resetSearch(): void {
    this.searchQuery = '';
    this.users = [];
    this.hasSearched = false;
    this.isLoading = false;
    this.errorMessage = '';
  }
}
