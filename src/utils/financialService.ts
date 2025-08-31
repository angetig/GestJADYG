import { supabase } from '../lib/supabase';
import { FinancialTransaction } from '../types';

export class FinancialService {
  // Récupérer toutes les transactions
  static async getAllTransactions(): Promise<FinancialTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      return [];
    }
  }

  // Récupérer les transactions d'un groupe spécifique
  static async getTransactionsByGroup(groupName: string): Promise<FinancialTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('group_name', groupName)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des transactions du groupe:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions du groupe:', error);
      return [];
    }
  }

  // Ajouter une nouvelle transaction
  static async addTransaction(transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          group_name: transaction.groupName,
          date: transaction.date,
          description: transaction.description,
          type: transaction.type,
          amount: transaction.amount,
          recorded_by: transaction.recordedBy,
          recorded_at: transaction.recordedAt,
          category: transaction.category
        }])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout de la transaction:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la transaction:', error);
      return null;
    }
  }

  // Mettre à jour une transaction
  static async updateTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour de la transaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la transaction:', error);
      return false;
    }
  }

  // Supprimer une transaction
  static async deleteTransaction(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de la transaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error);
      return false;
    }
  }

  // Calculer le solde d'un groupe
  static calculateGroupBalance(transactions: FinancialTransaction[]): number {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);
  }

  // Calculer le solde cumulé jusqu'à un index donné
  static calculateRunningBalance(transactions: FinancialTransaction[], index: number): number {
    let balance = 0;
    for (let i = 0; i <= index; i++) {
      const transaction = transactions[i];
      balance = transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }
    return balance;
  }

  // Générer un rapport mensuel
  static generateMonthlyReport(
    transactions: FinancialTransaction[],
    month: number,
    year: number,
    groupName?: string
  ): any {
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === month - 1 &&
             transactionDate.getFullYear() === year &&
             (!groupName || t.groupName === groupName);
    });

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      period: `${month.toString().padStart(2, '0')}/${year}`,
      groupName: groupName || 'Tous les groupes',
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactions: filteredTransactions,
      generatedAt: new Date().toISOString()
    };
  }
}