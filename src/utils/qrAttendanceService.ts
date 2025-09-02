import { supabase } from '../lib/supabase';
import { QRCode, AttendanceRecord } from '../types';

export class QRAttendanceService {
  // Générer un QR Code pour un événement (visible par tous les groupes)
  static async generateQRCode(eventData: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    createdBy: string;
    groupName?: string; // Optionnel - pour compatibilité
  }): Promise<QRCode | null> {
    try {
      // Générer un ID unique pour le QR code
      const qrCodeId = crypto.randomUUID();

      // Créer les données du QR code (JSON sérialisé)
      const qrData = {
        id: qrCodeId,
        eventId: eventData.eventId,
        eventTitle: eventData.eventTitle,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        timestamp: new Date().toISOString()
      };

      // Encoder en base64 pour le stockage
      const qrCodeString = btoa(JSON.stringify(qrData));

      // Calculer la date d'expiration (24h)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('qr_codes')
        .insert([{
          event_id: eventData.eventId,
          event_title: eventData.eventTitle,
          event_date: eventData.eventDate,
          event_time: eventData.eventTime,
          group_name: eventData.groupName || null, // Optionnel pour compatibilité
          qr_code: qrCodeString,
          expires_at: expiresAt.toISOString(),
          created_by: eventData.createdBy,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la génération du QR code:', error);
        return null;
      }

      return {
        id: data.id,
        eventId: data.event_id,
        eventTitle: data.event_title,
        eventDate: data.event_date,
        eventTime: data.event_time,
        groupName: data.group_name,
        qrCode: data.qr_code,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        createdBy: data.created_by,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      return null;
    }
  }

  // Récupérer tous les QR codes actifs
  static async getActiveQRCodes(): Promise<QRCode[]> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des QR codes:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        eventTitle: item.event_title,
        eventDate: item.event_date,
        eventTime: item.event_time,
        groupName: item.group_name,
        qrCode: item.qr_code,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        createdBy: item.created_by,
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des QR codes:', error);
      return [];
    }
  }

  // Récupérer tous les QR codes actifs (visibles par tous les groupes)
  static async getQRCodesByGroup(groupName?: string): Promise<QRCode[]> {
    try {
      // Retourne tous les QR codes actifs, peu importe le groupe
      // Cela permet à tous les groupes de voir tous les événements actifs
      let query = supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true);

      // Si un groupName est fourni, filtrer par groupe
      if (groupName) {
        query = query.eq('group_name', groupName);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des QR codes:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        eventId: item.event_id,
        eventTitle: item.event_title,
        eventDate: item.event_date,
        eventTime: item.event_time,
        groupName: item.group_name,
        qrCode: item.qr_code,
        expiresAt: item.expires_at,
        createdAt: item.created_at,
        createdBy: item.created_by,
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des QR codes:', error);
      return [];
    }
  }

  // Scanner un QR code et enregistrer la présence
  static async scanQRCode(qrCodeData: string, userData: {
    userId: string;
    userName: string;
    userGroup: string;
  }): Promise<AttendanceRecord | null> {
    try {
      // Décoder les données du QR code
      const decodedData = JSON.parse(atob(qrCodeData));

      // Vérifier si le QR code est valide et non expiré
      const qrCode = await this.getQRCodeById(decodedData.id);
      if (!qrCode || !qrCode.isActive) {
        throw new Error('QR code invalide ou expiré');
      }

      // Vérifier si l'utilisateur n'a pas déjà scanné ce QR code
      const existingScan = await this.getAttendanceRecord(decodedData.id, userData.userId);
      if (existingScan) {
        throw new Error('Vous avez déjà scanné ce QR code');
      }

      // Enregistrer la présence
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([{
          qr_code_id: decodedData.id,
          user_id: userData.userId,
          user_name: userData.userName,
          user_group: userData.userGroup,
          event_id: decodedData.eventId,
          event_title: decodedData.eventTitle,
          scanned_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'enregistrement de la présence:', error);
        return null;
      }

      return {
        id: data.id,
        qrCodeId: data.qr_code_id,
        userId: data.user_id,
        userName: data.user_name,
        userGroup: data.user_group,
        eventId: data.event_id,
        eventTitle: data.event_title,
        scannedAt: data.scanned_at,
        location: data.location,
        deviceInfo: data.device_info
      };
    } catch (error) {
      console.error('Erreur lors du scan du QR code:', error);
      return null;
    }
  }

  // Récupérer un QR code par son ID
  static async getQRCodeById(id: string): Promise<QRCode | null> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du QR code:', error);
        return null;
      }

      return {
        id: data.id,
        eventId: data.event_id,
        eventTitle: data.event_title,
        eventDate: data.event_date,
        eventTime: data.event_time,
        groupName: data.group_name,
        qrCode: data.qr_code,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        createdBy: data.created_by,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du QR code:', error);
      return null;
    }
  }

  // Vérifier si un utilisateur a déjà scanné un QR code
  static async getAttendanceRecord(qrCodeId: string, userId: string): Promise<AttendanceRecord | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si l'erreur est "PGRST116" (no rows), c'est normal
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erreur lors de la vérification de la présence:', error);
        return null;
      }

      return {
        id: data.id,
        qrCodeId: data.qr_code_id,
        userId: data.user_id,
        userName: data.user_name,
        userGroup: data.user_group,
        eventId: data.event_id,
        eventTitle: data.event_title,
        scannedAt: data.scanned_at,
        location: data.location,
        deviceInfo: data.device_info
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la présence:', error);
      return null;
    }
  }

  // Récupérer les enregistrements de présence pour un événement
  static async getAttendanceRecordsByEvent(eventId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', eventId)
        .order('scanned_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des présences:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        qrCodeId: item.qr_code_id,
        userId: item.user_id,
        userName: item.user_name,
        userGroup: item.user_group,
        eventId: item.event_id,
        eventTitle: item.event_title,
        scannedAt: item.scanned_at,
        location: item.location,
        deviceInfo: item.device_info
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des présences:', error);
      return [];
    }
  }

  // Désactiver un QR code
  static async deactivateQRCode(qrCodeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('id', qrCodeId);

      if (error) {
        console.error('Erreur lors de la désactivation du QR code:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la désactivation du QR code:', error);
      return false;
    }
  }

  // Enregistrer manuellement une présence (pour les responsables)
  static async recordManualAttendance(attendanceData: {
    eventId: string;
    eventTitle: string;
    userId: string;
    userName: string;
    userGroup: string;
  }): Promise<AttendanceRecord | null> {
    try {
      // Vérifier si l'utilisateur n'a pas déjà une présence pour cet événement
      const existingRecords = await this.getAttendanceRecordsByEvent(attendanceData.eventId);
      const alreadyPresent = existingRecords.some(record => record.userId === attendanceData.userId);

      if (alreadyPresent) {
        throw new Error('Cet utilisateur a déjà une présence enregistrée pour cet événement');
      }

      // Enregistrer la présence
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([{
          qr_code_id: `manual-${Date.now()}`, // ID spécial pour les présences manuelles
          user_id: attendanceData.userId,
          user_name: attendanceData.userName,
          user_group: attendanceData.userGroup,
          event_id: attendanceData.eventId,
          event_title: attendanceData.eventTitle,
          scanned_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'enregistrement manuel de la présence:', error);
        return null;
      }

      return {
        id: data.id,
        qrCodeId: data.qr_code_id,
        userId: data.user_id,
        userName: data.user_name,
        userGroup: data.user_group,
        eventId: data.event_id,
        eventTitle: data.event_title,
        scannedAt: data.scanned_at,
        location: data.location,
        deviceInfo: data.device_info
      };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement manuel:', error);
      return null;
    }
  }

  // Nettoyer les QR codes expirés
  static async cleanupExpiredQRCodes(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('deactivate_expired_qr_codes');

      if (error) {
        console.error('Erreur lors du nettoyage des QR codes expirés:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erreur lors du nettoyage des QR codes expirés:', error);
      return 0;
    }
  }
}