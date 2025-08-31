import { supabase } from '../lib/supabase';
import { CentralBureau, CentralBureauMember } from '../types';

export class CentralBureauService {
  // Récupérer le bureau central
  static async getCentralBureau(): Promise<CentralBureau | null> {
    try {
      const { data, error } = await supabase
        .from('central_bureau')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors de la récupération du bureau central:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du bureau central:', error);
      return null;
    }
  }

  // Créer ou mettre à jour le bureau central
  static async saveCentralBureau(bureau: Omit<CentralBureau, 'id' | 'createdAt' | 'updatedAt'>): Promise<CentralBureau | null> {
    try {
      const bureauData = {
        name: bureau.name,
        description: bureau.description,
        members: bureau.members,
        updatedAt: new Date().toISOString()
      };

      // Vérifier si le bureau existe déjà
      const existingBureau = await this.getCentralBureau();

      if (existingBureau) {
        // Mettre à jour
        const { data, error } = await supabase
          .from('central_bureau')
          .update(bureauData)
          .eq('id', existingBureau.id)
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de la mise à jour du bureau central:', error);
          return null;
        }

        return data;
      } else {
        // Créer
        const { data, error } = await supabase
          .from('central_bureau')
          .insert([{
            ...bureauData,
            createdAt: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Erreur lors de la création du bureau central:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du bureau central:', error);
      return null;
    }
  }

  // Ajouter un membre au bureau central
  static async addBureauMember(member: Omit<CentralBureauMember, 'id' | 'assignedAt' | 'isActive'>): Promise<CentralBureauMember | null> {
    try {
      const bureau = await this.getCentralBureau();
      if (!bureau) {
        console.error('Bureau central non trouvé');
        return null;
      }

      const newMember: CentralBureauMember = {
        id: Date.now().toString(),
        nomPrenom: member.nomPrenom,
        role: member.role,
        contact: member.contact,
        email: member.email,
        assignedAt: new Date().toISOString(),
        isActive: true
      };

      const updatedMembers = [...bureau.members, newMember];
      const updatedBureau = {
        ...bureau,
        members: updatedMembers
      };

      const result = await this.saveCentralBureau(updatedBureau);
      return result ? newMember : null;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      return null;
    }
  }

  // Mettre à jour un membre du bureau central
  static async updateBureauMember(memberId: string, updates: Partial<CentralBureauMember>): Promise<boolean> {
    try {
      const bureau = await this.getCentralBureau();
      if (!bureau) return false;

      const updatedMembers = bureau.members.map(member =>
        member.id === memberId ? { ...member, ...updates } : member
      );

      const updatedBureau = {
        ...bureau,
        members: updatedMembers
      };

      return await this.saveCentralBureau(updatedBureau) !== null;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du membre:', error);
      return false;
    }
  }

  // Supprimer un membre du bureau central
  static async removeBureauMember(memberId: string): Promise<boolean> {
    try {
      const bureau = await this.getCentralBureau();
      if (!bureau) return false;

      const updatedMembers = bureau.members.filter(member => member.id !== memberId);
      const updatedBureau = {
        ...bureau,
        members: updatedMembers
      };

      return await this.saveCentralBureau(updatedBureau) !== null;
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error);
      return false;
    }
  }
}