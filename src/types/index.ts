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

export interface GroupBureauMember {
  id: string;
  youthId: string; // Reference to the youth member
  role: string; // President, Secretary, Treasurer, etc.
  assignedAt: string;
}

export interface CentralBureauMember {
  id: string;
  nomPrenom: string;
  role: string; // Président, Vice-Président, Trésorier, Secrétaire, etc.
  contact?: string;
  email?: string;
  assignedAt: string;
  isActive: boolean;
}

export interface GroupBureau {
  id: string;
  groupName: string;
  members: GroupBureauMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CentralBureau {
  id: string;
  name: string;
  description?: string;
  members: CentralBureauMember[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PASSWORD = 'JADYG2026';

// Event types
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

export interface BureauMember {
  id: string;
  youthId: string; // Reference to the youth member
  role: string; // Role defined by group leader (President, Secretary, etc.)
  assignedAt: string; // ISO date when assigned to bureau
}

export interface Bureau {
  id?: string;
  groupName: string;
  members: BureauMember[];
  createdAt: string; // ISO date when bureau was created
  updatedAt: string; // ISO date when bureau was last updated
}

export type NotificationType = 'event_submitted' | 'event_approved' | 'event_rejected' | 'admin_event_created';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientType: 'admin' | 'group_leader';
  recipientGroup?: string; // For group leaders
  eventId?: string;
  eventTitle?: string;
  groupName?: string;
  createdAt: string;
  read: boolean;
}

export type SocialCaseType = 'marriage' | 'death' | 'birth';

export interface SocialCase {
  id: string;
  type: SocialCaseType;
  reportedBy: string; // Group name that reported it
  reportedAt: string;
  status: 'pending' | 'validated' | 'duplicate' | 'rejected';

  // Validation fields
  validatedBy?: string; // Admin who validated/rejected
  validatedAt?: string;
  rejectionReason?: string;

  // Common fields
  description?: string;

  // Marriage specific
  husbandName?: string;
  husbandGroup?: string; // Can be empty for non-members
  wifeName?: string;
  wifeGroup?: string; // Can be empty for non-members
  marriageDate?: string;

  // Death specific
  deceasedName?: string;
  relationship?: 'father' | 'mother' | 'brother' | 'sister' | 'child' | 'grandparent' | 'other';
  affectedYouth?: Array<{
    name: string;
    group: string;
  }>;
  deathDate?: string;

  // Birth specific
  fatherName?: string;
  fatherGroup?: string; // Can be empty for non-members
  motherName?: string;
  motherGroup?: string; // Can be empty for non-members
  newbornName?: string;
  birthDate?: string;

  // Deduplication
  duplicateOf?: string; // ID of the original case if this is a duplicate
  linkedYouthIds: string[]; // IDs of youth members linked to this case
}

// Accounting types
export type TransactionType = 'income' | 'expense';

export interface FinancialTransaction {
  id: string;
  groupName: string; // Group that recorded the transaction
  date: string; // ISO date
  description: string; // Libellé
  type: TransactionType;
  amount: number; // Amount in FCFA
  recordedBy: string; // Person who recorded it
  recordedAt: string; // ISO timestamp
  category?: string; // Optional category (cotisation, achat matériel, don, etc.)
}

export interface AccountingReport {
  period: string; // Month/Year identifier
  groupName: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: FinancialTransaction[];
  generatedAt: string;
}