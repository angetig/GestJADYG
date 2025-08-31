// Fonction utilitaire pour uploader une photo sur Supabase Storage
export async function uploadPhotoToSupabase(photo: File, userId: string): Promise<string | null> {
  const fileExt = photo.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `photos/${fileName}`;

  const { data, error } = await supabase.storage.from('photos').upload(filePath, photo);
  if (error) {
    console.error('Erreur upload photo:', error);
    return null;
  }
  // Récupérer l'URL publique
  const { publicUrl } = supabase.storage.from('photos').getPublicUrl(filePath).data;
  return publicUrl || null;
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement Supabase manquantes:', {
    url: supabaseUrl ? 'Définie' : 'Manquante',
    key: supabaseAnonKey ? 'Définie' : 'Manquante'
  });
  throw new Error('Variables d\'environnement Supabase manquantes. Veuillez cliquer sur "Connect to Supabase" en haut à droite.');
}

// Vérifier que l'URL est valide
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`URL Supabase invalide: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      financial_transactions: {
        Row: {
          id: string;
          group_name: string;
          date: string;
          description: string;
          type: 'income' | 'expense';
          amount: number;
          recorded_by: string;
          recorded_at: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_name: string;
          date: string;
          description: string;
          type: 'income' | 'expense';
          amount: number;
          recorded_by: string;
          recorded_at?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_name?: string;
          date?: string;
          description?: string;
          type?: 'income' | 'expense';
          amount?: number;
          recorded_by?: string;
          recorded_at?: string;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      youth_registrations: {
        Row: {
          id: string;
          nom_prenom: string;
          genre: 'Homme' | 'Femme';
          tranche_age: '13-17' | '18-24' | '25-30' | '31-40' | '41+';
          photo_url: string | null;
          quartier_residence: string;
          contact1: string;
          contact2: string | null;
          statut_matrimonial: 'Marié(e)' | 'Célibataire' | 'Veuf(ve)' | 'Fiancé(e)' | 'Concubinage';
          situation_professionnelle: 'Étudiant(e)' | 'Travailleur' | 'Sans emploi';
          type_travail: 'Public' | 'Privé' | 'Entrepreneur' | 'Je vais au cours' | null;
          niveau_etude: 'Aucun' | 'Primaire' | 'Secondaire' | 'Formation qualifiante' | 'Bac' | 'BTS' | 'Licence' | 'Master' | 'Doctorat' | 'Formation professionnelle' | 'DUT';
          annee_conversion: '0-3' | '4-7' | '7-10' | '10-20' | '20-40' | '40+';
          bapteme_eau: 'OUI' | 'NON';
          bapteme_saint_esprit: 'OUI' | 'NON';
          message_jeunesse: string | null;
          groupe_assigne: string;
          date_inscription: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom_prenom: string;
          genre: 'Homme' | 'Femme';
          tranche_age: '13-17' | '18-24' | '25-30' | '31-40' | '41+';
          photo_url?: string | null;
          quartier_residence: string;
          contact1: string;
          contact2?: string | null;
          statut_matrimonial: 'Marié(e)' | 'Célibataire' | 'Veuf(ve)' | 'Fiancé(e)' | 'Concubinage';
          situation_professionnelle: 'Étudiant(e)' | 'Travailleur' | 'Sans emploi';
          type_travail?: 'Public' | 'Privé' | 'Entrepreneur' | 'Je vais au cours' | null;
          niveau_etude: 'Aucun' | 'Primaire' | 'Secondaire' | 'Formation qualifiante' | 'Bac' | 'BTS' | 'Licence' | 'Master' | 'Doctorat' | 'Formation professionnelle' | 'DUT';
          annee_conversion: '0-3' | '4-7' | '7-10' | '10-20' | '20-40' | '40+';
          bapteme_eau: 'OUI' | 'NON';
          bapteme_saint_esprit: 'OUI' | 'NON';
          message_jeunesse?: string | null;
          groupe_assigne: string;
          date_inscription?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom_prenom?: string;
          genre?: 'Homme' | 'Femme';
          tranche_age?: '13-17' | '18-24' | '25-30' | '31-40' | '41+';
          photo_url?: string | null;
          quartier_residence?: string;
          contact1?: string;
          contact2?: string | null;
          statut_matrimonial?: 'Marié(e)' | 'Célibataire' | 'Veuf(ve)' | 'Fiancé(e)' | 'Concubinage';
          situation_professionnelle?: 'Étudiant(e)' | 'Travailleur' | 'Sans emploi';
          type_travail?: 'Public' | 'Privé' | 'Entrepreneur' | 'Je vais au cours' | null;
          niveau_etude?: 'Aucun' | 'Primaire' | 'Secondaire' | 'Formation qualifiante' | 'Bac' | 'BTS' | 'Licence' | 'Master' | 'Doctorat' | 'Formation professionnelle' | 'DUT';
          annee_conversion?: '0-3' | '4-7' | '7-10' | '10-20' | '20-40' | '40+';
          bapteme_eau?: 'OUI' | 'NON';
          bapteme_saint_esprit?: 'OUI' | 'NON';
          message_jeunesse?: string | null;
          groupe_assigne?: string;
          date_inscription?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};