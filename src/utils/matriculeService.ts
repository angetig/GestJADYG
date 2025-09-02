import { supabase } from '../lib/supabase';

export class MatriculeService {
  // Générer un matricule côté client (pour prévisualisation)
  static generateMatriculePreview(yearCode?: string): string {
    const year = yearCode || new Date().getFullYear().toString().slice(-2);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';

    for (let i = 0; i < 2; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return year + randomPart;
  }

  // Valider le format d'un matricule
  static validateMatriculeFormat(matricule: string): boolean {
    if (!matricule || matricule.length !== 4) {
      return false;
    }

    // Format: 2 chiffres + 2 caractères alphanumériques
    const regex = /^[0-9]{2}[A-Z0-9]{2}$/i;
    return regex.test(matricule);
  }

  // Extraire l'année d'un matricule
  static getYearFromMatricule(matricule: string): string | null {
    if (!this.validateMatriculeFormat(matricule)) {
      return null;
    }

    const yearCode = matricule.substring(0, 2);
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;

    // Gérer les années 2000-2099
    if (parseInt(yearCode) <= parseInt(currentYear)) {
      return (currentCentury + parseInt(yearCode)).toString();
    } else {
      return ((currentCentury - 100) + parseInt(yearCode)).toString();
    }
  }

  // Vérifier si un matricule existe déjà
  static async checkMatriculeExists(matricule: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('youth_registrations')
        .select('id')
        .eq('matricule', matricule.toUpperCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // PGRST116 = no rows returned
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erreur lors de la vérification du matricule:', error);
      return false;
    }
  }

  // Générer un matricule unique côté serveur
  static async generateUniqueMatricule(yearCode?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('generate_matricule', {
        year_code: yearCode
      });

      if (error) {
        console.error('Erreur lors de la génération du matricule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la génération du matricule:', error);
      return null;
    }
  }

  // Attribuer des matricules aux jeunes existants
  static async assignMatriculesToExistingYouth(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('assign_matricules_to_existing_youth');

      if (error) {
        console.error('Erreur lors de l\'attribution des matricules:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erreur lors de l\'attribution des matricules:', error);
      return 0;
    }
  }

  // Obtenir les statistiques des matricules
  static async getMatriculeStats() {
    try {
      const { data, error } = await supabase
        .from('matricule_stats')
        .select('*')
        .order('year_code', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return [];
    }
  }

  // Rechercher un jeune par matricule
  static async findYouthByMatricule(matricule: string) {
    try {
      const { data, error } = await supabase
        .from('youth_registrations')
        .select('*')
        .eq('matricule', matricule.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Matricule non trouvé
        }
        console.error('Erreur lors de la recherche:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la recherche par matricule:', error);
      return null;
    }
  }

  // Formater l'affichage d'un matricule
  static formatMatricule(matricule: string): string {
    if (!matricule) return '';

    // Séparer les parties pour un meilleur affichage
    const yearPart = matricule.substring(0, 2);
    const codePart = matricule.substring(2, 4);

    return `${yearPart}-${codePart}`;
  }

  // Générer plusieurs matricules pour prévisualisation
  static generateMatriculeSuggestions(count: number = 5, yearCode?: string): string[] {
    const suggestions: string[] = [];
    const used = new Set<string>();

    while (suggestions.length < count) {
      const matricule = this.generateMatriculePreview(yearCode);

      if (!used.has(matricule)) {
        used.add(matricule);
        suggestions.push(matricule);
      }
    }

    return suggestions;
  }

  // Calculer l'année complète à partir du code année
  static expandYearCode(yearCode: string): number {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const yearNum = parseInt(yearCode);

    // Si le code année est inférieur ou égal à l'année actuelle (2 derniers chiffres)
    if (yearNum <= (currentYear % 100)) {
      return currentCentury + yearNum;
    } else {
      // Sinon, c'est probablement l'année précédente
      return (currentCentury - 100) + yearNum;
    }
  }
}