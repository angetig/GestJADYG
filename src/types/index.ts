export interface YouthData {
  id: string;
  // Informations Personnelles
  nomPrenom: string;
  genre: 'Homme' | 'Femme';
  trancheAge: '13-17' | '18-24' | '25-30' | '31-40' | '41+';
  photo?: File | null;
  photoUrl?: string;
  quartierResidence: string;
  contact1: string;
  contact2?: string;
  
  // Statut matrimonial
  statutMatrimonial: 'Marié(e)' | 'Célibataire' | 'Veuf(ve)' | 'Fiancé(e)' | 'Concubinage';
  
  // Situation professionnelle
  situationProfessionnelle: 'Étudiant(e)' | 'Travailleur' | 'Sans emploi';
  typeTravail?: 'Public' | 'Privé' | 'Entrepreneur' | 'Je vais au cours';
  niveauEtude: 'Aucun' | 'Primaire' | 'Secondaire' | 'Formation qualifiante' | 'Bac' | 'BTS' | 'Licence' | 'Master' | 'Doctorat' | 'Formation professionnelle' | 'DUT';
  
  // Situation Spirituelle
  anneeConversion: '0-3' | '4-7' | '7-10' | '10-20' | '20-40' | '40+';
  baptemeEau: 'OUI' | 'NON';
  baptemeSaintEsprit: 'OUI' | 'NON';
  
  // Message
  messageJeunesse?: string;
  
  // Groupe assigné
  groupeAssigne?: string;
  dateInscription: Date;
}

export interface GroupStats {
  [groupName: string]: {
    total: number;
    maries: number;
    celibataires: number;
    travailleurs: number;
    etudiants: number;
    sansEmploi: number;
    hommes: number;
    femmes: number;
  };
}

export const YOUTH_GROUPS = [
  "Disciples",
  "Les Élus", 
  "Sel et Lumière",
  "Porteurs de l'Alliance",
  "Bergerie du Maître",
  "Vases d'Honneur",
  "Sacerdoce Royal",
  "Flambeaux",
  "Serviteurs Fidèles",
  "Héritiers du Royaume"
] as const;

export interface AuthUser {
  role: 'admin' | 'group_leader';
  groupName?: string;
  isAuthenticated: boolean;
}

export const DEFAULT_PASSWORD = 'JADYG2026';