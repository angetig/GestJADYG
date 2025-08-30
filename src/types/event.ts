export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface EventRequest {
  id?: string;
  title: string;
  date: string; // ISO format
  time: string; // HH:mm
  location: string;
  objectives: string;
  budget?: number;
  description: string;
  status: EventStatus;
  groupName: string;
  submittedAt: string; // ISO date
  rejectionComment?: string; // For rejected status
  adminComment?: string; // Admin feedback/comments
}
