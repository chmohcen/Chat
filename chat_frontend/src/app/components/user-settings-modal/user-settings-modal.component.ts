import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/chat.model';

interface SettingsForm {
  name: string;
  email: string;
  password: string;
  picture: string;
  status: User['status'];
}

@Component({
  selector: 'app-user-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-settings-modal.component.html',
  styleUrl: './user-settings-modal.component.scss'
})
export class UserSettingsModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() currentUser: User | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<User>();

  selectedPictureFile: File | null = null;
  previewPictureUrl: string | null = null;
  private objectUrl: string | null = null;
  settingsForm: SettingsForm = {
    name: '',
    email: '',
    password: '',
    picture: '',
    status: 'online'
  };
  statusOptions = [
    { value: 'online', label: 'Online' },
    { value: 'away', label: 'Away' },
    { value: 'offline', label: 'Offline' }
  ];

  constructor(private authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUser'] || changes['isOpen']) {
      this.resetSettingsForm();
    }
  }

  close(): void {
    this.revokePreviewObjectUrl();
    this.selectedPictureFile = null;
    this.previewPictureUrl = this.currentUser?.final_picture ?? null;
    this.closed.emit();
  }

  saveSettings(): void {
    if (!this.currentUser) {
      return;
    }

    const request = this.selectedPictureFile
      ? this.buildSettingsFormData()
      : this.buildSettingsPayload();

    this.authService.updateCurrentUser(request).subscribe((user) => {
      this.currentUser = user;
      this.revokePreviewObjectUrl();
      this.selectedPictureFile = null;
      this.previewPictureUrl = this.currentUser?.final_picture ?? null;
      this.userUpdated.emit(user);
      this.closed.emit();
    });
  }

  onPictureFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.revokePreviewObjectUrl();

    if (!file) {
      this.selectedPictureFile = null;
      this.previewPictureUrl = this.currentUser?.final_picture ?? null;
      return;
    }

    this.selectedPictureFile = file;
    this.objectUrl = URL.createObjectURL(file);
    this.previewPictureUrl = this.objectUrl;
  }

  private buildSettingsPayload(): Partial<User> {
    const payload: Partial<User> = {
      name: this.settingsForm.name.trim() || this.currentUser?.name || '',
      status: this.settingsForm.status,
      email: this.settingsForm.email.trim() || this.currentUser?.email || ''
    };

    if (this.settingsForm.password.trim()) {
      payload.password = this.settingsForm.password.trim();
    }

    return payload;
  }

  private buildSettingsFormData(): FormData {
    const formData = new FormData();
    formData.append('name', this.settingsForm.name.trim() || this.currentUser?.name || '');
    formData.append('status', this.settingsForm.status);
    formData.append('email', this.settingsForm.email.trim() || this.currentUser?.email || '');

    if (this.settingsForm.password.trim()) {
      formData.append('password', this.settingsForm.password.trim());
    }

    if (this.selectedPictureFile) {
      formData.append('picture', this.selectedPictureFile, this.selectedPictureFile.name);
    }

    return formData;
  }

  private resetSettingsForm(): void {
    this.settingsForm = {
      name: this.currentUser?.name ?? '',
      email: this.currentUser?.email ?? '',
      password: this.currentUser?.password ?? '',
      picture: this.currentUser?.picture ?? '',
      status: this.currentUser?.status ?? 'online'
    };
    this.selectedPictureFile = null;
    this.revokePreviewObjectUrl();
    this.previewPictureUrl = this.currentUser?.final_picture ?? null;
  }

  private revokePreviewObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
