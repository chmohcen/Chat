import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chat } from '../../models/chat.model';
import { AuthService } from '../../services/auth.service';
import { StatusColorPipe } from '../../pipes/status-color.pipe';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, StatusColorPipe],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss'
})
export class ChatHeaderComponent implements OnInit {
  @Input() chat: Chat | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
