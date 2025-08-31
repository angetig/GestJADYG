import { Notification, NotificationType } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private readonly STORAGE_KEY = 'gestjadyg_notifications';

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create a new notification
  createNotification(
    type: NotificationType,
    title: string,
    message: string,
    recipientType: 'admin' | 'group_leader',
    recipientGroup?: string,
    eventId?: string,
    eventTitle?: string,
    groupName?: string
  ): Notification {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      recipientType,
      recipientGroup,
      eventId,
      eventTitle,
      groupName,
      createdAt: new Date().toISOString(),
      read: false
    };

    this.saveNotification(notification);
    return notification;
  }

  // Get all notifications for a specific recipient
  getNotifications(recipientType: 'admin' | 'group_leader', groupName?: string): Notification[] {
    const allNotifications = this.getAllNotifications();

    return allNotifications.filter(notification => {
      if (notification.recipientType !== recipientType) return false;
      if (recipientType === 'group_leader' && notification.recipientGroup !== groupName) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedNotifications));
  }

  // Mark all notifications as read for a recipient
  markAllAsRead(recipientType: 'admin' | 'group_leader', groupName?: string): void {
    const notifications = this.getAllNotifications();
    const updatedNotifications = notifications.map(notification => {
      if (notification.recipientType === recipientType &&
          (recipientType !== 'group_leader' || notification.recipientGroup === groupName)) {
        return { ...notification, read: true };
      }
      return notification;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedNotifications));
  }

  // Get unread count
  getUnreadCount(recipientType: 'admin' | 'group_leader', groupName?: string): number {
    return this.getNotifications(recipientType, groupName).filter(n => !n.read).length;
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotifications));
  }

  // Helper methods
  private saveNotification(notification: Notification): void {
    const notifications = this.getAllNotifications();
    notifications.push(notification);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
  }

  private getAllNotifications(): Notification[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Specific notification creation methods
  notifyEventSubmitted(event: any): void {
    this.createNotification(
      'event_submitted',
      'Nouvelle demande d\'événement',
      `Le groupe "${event.groupName}" a soumis une demande pour l'événement "${event.title}"`,
      'admin',
      undefined,
      event.id,
      event.title,
      event.groupName
    );
  }

  notifyEventApproved(event: any, groupName: string): void {
    this.createNotification(
      'event_approved',
      'Événement approuvé',
      `Votre événement "${event.title}" a été approuvé par l'administrateur`,
      'group_leader',
      groupName,
      event.id,
      event.title
    );
  }

  notifyEventRejected(event: any, groupName: string, reason?: string): void {
    const message = reason
      ? `Votre événement "${event.title}" a été refusé. Raison: ${reason}`
      : `Votre événement "${event.title}" a été refusé par l'administrateur`;

    this.createNotification(
      'event_rejected',
      'Événement refusé',
      message,
      'group_leader',
      groupName,
      event.id,
      event.title
    );
  }

  notifyAdminEventCreated(event: any): void {
    // Notify all groups about admin-created event
    const groupNames = ['Disciples', 'Les Élus', 'Sel et Lumière', 'Porteurs de l\'Alliance', 'Bergerie du Maître'];

    groupNames.forEach(groupName => {
      this.createNotification(
        'admin_event_created',
        'Nouvel événement administrateur',
        `L'administrateur a créé un nouvel événement: "${event.title}"`,
        'group_leader',
        groupName,
        event.id,
        event.title
      );
    });
  }
}

export const notificationService = NotificationService.getInstance();