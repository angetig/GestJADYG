import { supabase } from '../lib/supabase';
import { EventRequest } from '../types';

export class EventService {
  // Récupérer tous les événements approuvés
  static async getApprovedEvents(): Promise<EventRequest[]> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des événements approuvés:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        title: item.title,
        date: item.date,
        time: item.time,
        location: item.location,
        objectives: item.objectives,
        budget: item.budget,
        description: item.description,
        status: item.status,
        groupName: item.group_name,
        submittedAt: item.submitted_at,
        rejectionComment: item.rejection_comment,
        adminComment: item.admin_comment
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des événements approuvés:', error);
      return [];
    }
  }

  // Récupérer tous les événements (pour l'admin)
  static async getAllEvents(): Promise<EventRequest[]> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        title: item.title,
        date: item.date,
        time: item.time,
        location: item.location,
        objectives: item.objectives,
        budget: item.budget,
        description: item.description,
        status: item.status,
        groupName: item.group_name,
        submittedAt: item.submitted_at,
        rejectionComment: item.rejection_comment,
        adminComment: item.admin_comment
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      return [];
    }
  }

  // Créer un événement (pour l'admin)
  static async createEvent(eventData: Omit<EventRequest, 'id' | 'submittedAt'>): Promise<EventRequest | null> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .insert([{
          title: eventData.title,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          objectives: eventData.objectives,
          budget: eventData.budget,
          description: eventData.description,
          status: eventData.status || 'approved', // Admin crée directement approuvé
          group_name: eventData.groupName,
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        date: data.date,
        time: data.time,
        location: data.location,
        objectives: data.objectives,
        budget: data.budget,
        description: data.description,
        status: data.status,
        groupName: data.group_name,
        submittedAt: data.submitted_at,
        rejectionComment: data.rejection_comment,
        adminComment: data.admin_comment
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      return null;
    }
  }

  // Mettre à jour le statut d'un événement
  static async updateEventStatus(eventId: string, status: EventRequest['status'], adminComment?: string, rejectionComment?: string): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (adminComment) updateData.admin_comment = adminComment;
      if (rejectionComment) updateData.rejection_comment = rejectionComment;

      const { error } = await supabase
        .from('event_requests')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }
  }
}