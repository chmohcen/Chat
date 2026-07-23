import { Pipe, PipeTransform } from '@angular/core';

const STATUS_COLORS: Record<string, string> = {
  online: '#31a24c',
  away: '#f39c12',
  offline: '#95a5a6',
};

@Pipe({
  name: 'statusColor',
  standalone: true,
})
export class StatusColorPipe implements PipeTransform {
  transform(status: string): string {
    return STATUS_COLORS[status] ?? STATUS_COLORS['offline'];
  }
}
