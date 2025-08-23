import { supabase } from '../lib/supabase';
import { YouthData, GroupStats, YOUTH_GROUPS } from '../types';

export class GroupAssignmentService {
  
  static async getStoredData(): Promise<YouthData[]> {
    try {
      const { data, error } = await supabase
        .from('youth_registrations')
        .select('*')
        .order('date_inscription', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return [];
      }

      return data?.map(this.mapDatabaseToYouthData) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      return [];
    }
  }
  
  static async checkDuplicate(newYouth: YouthData): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('youth_registrations')
        .select('id')
        .eq('nom_prenom', newYouth.nomPrenom)
        .eq('situation_professionnelle', newYouth.situationProfessionnelle)
        .eq('statut_matrimonial', newYouth.statutMatrimonial)
        .eq('quartier_residence', newYouth.quartierResidence);

      if (error) {
        console.error('Erreur lors de la vérification des doublons:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification des doublons:', error);
      return false;
    }
  }
  
  static async calculateGroupStats(): Promise<GroupStats> {
    const data = await this.getStoredData();
    const stats: GroupStats = {};
    
    // Initialiser les stats pour chaque groupe
    YOUTH_GROUPS.forEach(group => {
      stats[group] = {
        total: 0,
        maries: 0,
        celibataires: 0,
        travailleurs: 0,
        etudiants: 0,
        sansEmploi: 0,
        hommes: 0,
        femmes: 0
      };
    });
    
    // Calculer les stats actuelles
    data.forEach(youth => {
      if (youth.groupeAssigne && stats[youth.groupeAssigne]) {
        const group = stats[youth.groupeAssigne];
        group.total++;
        
        if (youth.statutMatrimonial === 'Marié(e)') group.maries++;
        else group.celibataires++;
        
        if (youth.situationProfessionnelle === 'Travailleur') group.travailleurs++;
        else if (youth.situationProfessionnelle === 'Étudiant(e)') group.etudiants++;
        else group.sansEmploi++;
        
        if (youth.genre === 'Homme') group.hommes++;
        else group.femmes++;
      }
    });
    
    return stats;
  }
  
  static async assignGroup(youth: YouthData): Promise<string> {
    const stats = await this.calculateGroupStats();
    
    // Critères de score pour chaque groupe (plus le score est bas, mieux c'est)
    const groupScores = YOUTH_GROUPS.map(group => {
      const groupStats = stats[group];
      let score = 0;
      
      // Pénalité pour déséquilibre total
      score += groupStats.total * 10;
      
      // Pénalités spécifiques selon les caractéristiques du jeune
      if (youth.statutMatrimonial === 'Marié(e)') {
        score += groupStats.maries * 5;
      } else {
        score += groupStats.celibataires * 3;
      }
      
      if (youth.situationProfessionnelle === 'Travailleur') {
        score += groupStats.travailleurs * 4;
      } else if (youth.situationProfessionnelle === 'Étudiant(e)') {
        score += groupStats.etudiants * 4;
      } else {
        score += groupStats.sansEmploi * 4;
      }
      
      if (youth.genre === 'Homme') {
        score += groupStats.hommes * 3;
      } else {
        score += groupStats.femmes * 3;
      }
      
      return { group, score };
    });
    
    // Trier par score croissant et prendre le meilleur
    groupScores.sort((a, b) => a.score - b.score);
    
    return groupScores[0].group;
  }
  
  static async registerYouth(youth: YouthData): Promise<{ success: boolean; message: string; group?: string }> {
    try {
      // Vérifier les doublons
      const isDuplicate = await this.checkDuplicate(youth);
      if (isDuplicate) {
        return {
          success: false,
          message: "Une personne avec ces caractéristiques est déjà inscrite."
        };
      }
      
      // Assigner un groupe
      const assignedGroup = await this.assignGroup(youth);
      
      // Upload de la photo si présente
      let photoUrl = null;
      if (youth.photo) {
        const { v4: uuidv4 } = require('uuid');
        const userId = uuidv4();
        photoUrl = await import('../lib/supabase').then(mod => mod.uploadPhotoToSupabase(youth.photo as File, userId));
      }

      // Préparer les données pour la base de données
      const dbData = {
        ...this.mapYouthDataToDatabase(youth, assignedGroup),
        photo_url: photoUrl || null,
      };

      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('youth_registrations')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return {
          success: false,
          message: "Erreur lors de l'inscription. Veuillez réessayer."
        };
      }
      
      return {
        success: true,
        message: `Inscription réussie ! Vous avez été assigné(e) au groupe "${assignedGroup}".`,
        group: assignedGroup
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return {
        success: false,
        message: "Erreur lors de l'inscription. Veuillez réessayer."
      };
    }
  }

  static async clearAllData(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('youth_registrations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  static async getGroupMembers(groupName: string): Promise<YouthData[]> {
    try {
      const { data, error } = await supabase
        .from('youth_registrations')
        .select('*')
        .eq('groupe_assigne', groupName)
        .order('nom_prenom');

      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error(`Erreur de base de données: ${error.message}`);
      }

      // Mapper les propriétés de la base vers le format attendu par YouthData
      return (data || []).map((item: any) => ({
        ...item,
        nomPrenom: item.nom_prenom,
        trancheAge: item.tranche_age,
        quartierResidence: item.quartier_residence,
        statutMatrimonial: item.statut_matrimonial,
        situationProfessionnelle: item.situation_professionnelle,
        typeTravail: item.type_travail,
        niveauEtude: item.niveau_etude,
        anneeConversion: item.annee_conversion,
        baptemeEau: item.bapteme_eau,
        baptemeSaintEsprit: item.bapteme_saint_esprit,
        messageJeunesse: item.message_jeunesse,
        groupeAssigne: item.groupe_assigne,
        dateInscription: item.date_inscription ? new Date(item.date_inscription) : undefined,
        photoUrl: item.photo_url || '',
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Impossible de se connecter à la base de données. Vérifiez votre connexion internet et la configuration Supabase.');
      }
      throw error;
    }
  }

  // Fonctions utilitaires pour mapper les données
  private static mapYouthDataToDatabase(youth: YouthData, assignedGroup: string) {
    return {
      nom_prenom: youth.nomPrenom,
      genre: youth.genre,
      tranche_age: youth.trancheAge,
      photo_url: youth.photo ? null : null, // Pour l'instant, on ne gère pas l'upload de photos
      quartier_residence: youth.quartierResidence,
      contact1: youth.contact1,
      contact2: youth.contact2 || null,
      statut_matrimonial: youth.statutMatrimonial,
      situation_professionnelle: youth.situationProfessionnelle,
      type_travail: youth.typeTravail || null,
      niveau_etude: youth.niveauEtude,
      annee_conversion: youth.anneeConversion,
      bapteme_eau: youth.baptemeEau,
      bapteme_saint_esprit: youth.baptemeSaintEsprit,
      message_jeunesse: youth.messageJeunesse || null,
      groupe_assigne: assignedGroup,
      date_inscription: new Date().toISOString()
    };
  }

  private static mapDatabaseToYouthData(dbRecord: any): YouthData {
    return {
      id: dbRecord.id,
      nomPrenom: dbRecord.nom_prenom,
      genre: dbRecord.genre,
      trancheAge: dbRecord.tranche_age,
      photo: null, // Pour l'instant, on ne gère pas les photos
      quartierResidence: dbRecord.quartier_residence,
      contact1: dbRecord.contact1,
      contact2: dbRecord.contact2,
      statutMatrimonial: dbRecord.statut_matrimonial,
      situationProfessionnelle: dbRecord.situation_professionnelle,
      typeTravail: dbRecord.type_travail,
      niveauEtude: dbRecord.niveau_etude,
      anneeConversion: dbRecord.annee_conversion,
      baptemeEau: dbRecord.bapteme_eau,
      baptemeSaintEsprit: dbRecord.bapteme_saint_esprit,
      messageJeunesse: dbRecord.message_jeunesse,
      groupeAssigne: dbRecord.groupe_assigne,
      dateInscription: new Date(dbRecord.date_inscription)
    };
  }
}