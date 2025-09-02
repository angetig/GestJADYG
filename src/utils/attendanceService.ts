import { supabase } from '../lib/supabase';

export interface AttendanceRequest {
  id: string;
  matricule: string;
  userName: string;
  userGroup: string;
  eventTitle: string;
  eventId: string;
  qrCodeId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  groupLeaderId: string;
  groupLeaderName: string;
}

export class AttendanceService {
  // Créer une demande de présence
  static async createAttendanceRequest(requestData: {
    matricule: string;
    userName: string;
    userGroup: string;
    eventTitle: string;
    eventId: string;
    qrCodeId: string;
    groupLeaderId: string;
    groupLeaderName: string;
  }): Promise<AttendanceRequest | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_requests')
        .insert([{
          matricule: requestData.matricule,
          user_name: requestData.userName,
          user_group: requestData.userGroup,
          event_title: requestData.eventTitle,
          event_id: requestData.eventId,
          qr_code_id: requestData.qrCodeId,
          group_leader_id: requestData.groupLeaderId,
          group_leader_name: requestData.groupLeaderName,
          status: 'pending',
          requested_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la demande:', error);
        return null;
      }

      return {
        id: data.id,
        matricule: data.matricule,
        userName: data.user_name,
        userGroup: data.user_group,
        eventTitle: data.event_title,
        eventId: data.event_id,
        qrCodeId: data.qr_code_id,
        requestedAt: data.requested_at,
        status: data.status,
        groupLeaderId: data.group_leader_id,
        groupLeaderName: data.group_leader_name
      };
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      return null;
    }
  }

  // Récupérer les demandes en attente pour un responsable de groupe
  static async getPendingRequests(groupLeaderId: string): Promise<AttendanceRequest[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('group_leader_id', groupLeaderId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        matricule: item.matricule,
        userName: item.user_name,
        userGroup: item.user_group,
        eventTitle: item.event_title,
        eventId: item.event_id,
        qrCodeId: item.qr_code_id,
        requestedAt: item.requested_at,
        status: item.status,
        groupLeaderId: item.group_leader_id,
        groupLeaderName: item.group_leader_name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      return [];
    }
  }

  // Approuver ou rejeter une demande de présence
  static async updateAttendanceRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    qrCodeData?: string
  ): Promise<boolean> {
    try {
      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('attendance_requests')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de la demande:', updateError);
        return false;
      }

      // Si approuvé et que nous avons les données QR, enregistrer la présence
      if (status === 'approved' && qrCodeData) {
        // Ici nous pourrions appeler le service QR pour enregistrer la présence
        // Pour l'instant, nous nous contentons de mettre à jour le statut
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error);
      return false;
    }
  }

  // Récupérer l'historique des demandes pour un responsable de groupe
  static async getAttendanceHistory(groupLeaderId: string): Promise<AttendanceRequest[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('group_leader_id', groupLeaderId)
        .in('status', ['approved', 'rejected'])
        .order('requested_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        matricule: item.matricule,
        userName: item.user_name,
        userGroup: item.user_group,
        eventTitle: item.event_title,
        eventId: item.event_id,
        qrCodeId: item.qr_code_id,
        requestedAt: item.requested_at,
        status: item.status,
        groupLeaderId: item.group_leader_id,
        groupLeaderName: item.group_leader_name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  // Vérifier si un utilisateur a déjà une demande en attente pour cet événement
  static async hasPendingRequest(matricule: string, eventId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('attendance_requests')
        .select('id')
        .eq('matricule', matricule)
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .single();

      if (error) {
        // Si l'erreur est "PGRST116" (no rows), c'est normal
        if (error.code === 'PGRST116') {
          return false;
        }
        console.error('Erreur lors de la vérification des demandes en attente:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erreur lors de la vérification des demandes en attente:', error);
      return false;
    }
  }
}