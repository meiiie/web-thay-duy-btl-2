import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.html',
  styleUrls: ['./notification.scss'],
  imports: [CommonModule],
  standalone: true
})
export class NotificationComponent implements OnInit, OnDestroy {
  @Input() type: NotificationType = 'info';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() dismissible: boolean = true;
  @Input() autoClose: boolean = true;
  @Input() duration: number = 5000;
  
  @Output() closed = new EventEmitter<void>();
  
  show = false;
  private timeoutId?: number;

  ngOnInit() {
    // Show notification with animation
    setTimeout(() => {
      this.show = true;
    }, 100);

    // Auto close if enabled
    if (this.autoClose && this.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close() {
    this.show = false;
    setTimeout(() => {
      this.closed.emit();
    }, 300); // Wait for animation to complete
  }
}