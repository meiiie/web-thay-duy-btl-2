import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { NotificationComponent, NotificationType } from '../components/shared/notification/notification';

export interface NotificationConfig {
  type: NotificationType;
  title: string;
  message: string;
  dismissible?: boolean;
  autoClose?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: ComponentRef<NotificationComponent>[] = [];

  constructor() {}

  show(config: NotificationConfig): ComponentRef<NotificationComponent> {
    // Create notification component
    const notificationRef = this.createNotification(config);
    
    // Add to notifications array
    this.notifications.push(notificationRef);
    
    // Handle close event
    notificationRef.instance.closed.subscribe(() => {
      this.removeNotification(notificationRef);
    });

    return notificationRef;
  }

  success(title: string, message: string, options?: Partial<NotificationConfig>) {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  error(title: string, message: string, options?: Partial<NotificationConfig>) {
    return this.show({
      type: 'error',
      title,
      message,
      autoClose: false, // Don't auto-close errors
      ...options
    });
  }

  warning(title: string, message: string, options?: Partial<NotificationConfig>) {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    });
  }

  info(title: string, message: string, options?: Partial<NotificationConfig>) {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    });
  }

  private createNotification(config: NotificationConfig): ComponentRef<NotificationComponent> {
    // This is a simplified version - in a real app you'd use ViewContainerRef
    // For now, we'll create a mock component ref
    const mockRef = {
      instance: {
        type: config.type,
        title: config.title,
        message: config.message,
        dismissible: config.dismissible ?? true,
        autoClose: config.autoClose ?? true,
        duration: config.duration ?? 5000,
        show: true,
        closed: { emit: () => {}, subscribe: () => ({ unsubscribe: () => {} }) } as any
      } as any,
      destroy: () => {
        // Mock destroy method
      }
    } as ComponentRef<NotificationComponent>;

    return mockRef;
  }

  private removeNotification(notificationRef: ComponentRef<NotificationComponent>) {
    const index = this.notifications.indexOf(notificationRef);
    if (index > -1) {
      this.notifications.splice(index, 1);
      notificationRef.destroy();
    }
  }

  clearAll() {
    this.notifications.forEach(notification => {
      notification.destroy();
    });
    this.notifications = [];
  }
}