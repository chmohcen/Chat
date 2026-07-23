import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  @Output() messageSent = new EventEmitter<string>();

  messageText: string = '';
  showEmojiPicker: boolean = false;


  onSendMessage(): void {
    if (this.messageText.trim()) {
      this.messageSent.emit(this.messageText);
      this.messageText = '';
      this.showEmojiPicker = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  addEmoji(emojiObject: any): void {
    const emoji = emojiObject.emoji.native;
    const needsLeadingSpace = this.messageText.length > 0 && !this.messageText.endsWith(' ');
    this.messageText = `${this.messageText}${needsLeadingSpace ? ' ' : ''}${emoji} `;
    this.showEmojiPicker = false;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
}
