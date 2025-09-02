import React, { useState, useEffect } from 'react';
import { FinancialTransaction, YOUTH_GROUPS } from '../types';
import { FileSpreadsheet, Plus, Calculator, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { FinancialService } from '../utils/financialService';
import { supabase } from '../lib/supabase';

interface AccountingManagerProps {
  onClose: () => void;
}

const AccountingManager: React.FC<AccountingManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [databaseStatus, setDatabaseStatus] = useState<{
    hasData: boolean;
    transactionCount: number;
    lastTransaction?: string;
  }>({ hasData: false, transactionCount: 0 });

  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [monthlyReport, setMonthlyReport] = useState<any>(null);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: ''
  });

  // Get current user role and group
  const currentUserData = localStorage.getItem('youth_auth');
  let currentUser: any = {};
  try {
    currentUser = currentUserData ? JSON.parse(currentUserData) : {};
  } catch (error) {
    console.error('Erreur parsing user data:', error);
  }

  const isAdmin = currentUser.role === 'admin';
  const userGroup = currentUser.groupName || 'Non défini';

  useEffect(() => {
    loadTransactions();
  }, [isAdmin, userGroup]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let transactionsData: FinancialTransaction[] = [];

      if (isAdmin) {
        // Admin voit toutes les transactions
        transactionsData = await FinancialService.getAllTransactions();
      } else if (userGroup && userGroup !== 'Non défini') {
        // Responsable de groupe voit seulement son groupe
        transactionsData = await FinancialService.getTransactionsByGroup(userGroup);
      }

      // Utiliser les données de Supabase uniquement (pas de données d'exemple)
      setTransactions(transactionsData);

      // Mettre à jour le statut de la base de données
      const hasData = transactionsData.length > 0;
      const lastTransaction = hasData
        ? new Date(Math.max(...transactionsData.map(t => new Date(t.date).getTime()))).toLocaleDateString('fr-FR')
        : undefined;

      setDatabaseStatus({
        hasData,
        transactionCount: transactionsData.length,
        lastTransaction
      });
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      // En cas d'erreur, utiliser un tableau vide (pas de données d'exemple)
      setTransactions([]);
      setDatabaseStatus({ hasData: false, transactionCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionForm.description || !transactionForm.amount) return;

    // Pour les responsables de groupe, vérifier que le groupe est défini
    if (!isAdmin && !userGroup) {
      alert('Erreur: Votre groupe n\'est pas défini. Veuillez vous reconnecter.');
      return;
    }

    const newTransactionData = {
      groupName: isAdmin ? (selectedGroup === 'all' ? 'Tous les groupes' : selectedGroup) : userGroup,
      date: transactionForm.date,
      description: transactionForm.description,
      type: transactionForm.type,
      amount: parseFloat(transactionForm.amount),
      recordedBy: currentUser.name || 'Utilisateur',
      recordedAt: new Date().toISOString(),
      category: transactionForm.category || undefined
    };

    try {
      const newTransaction = await FinancialService.addTransaction(newTransactionData);

      if (newTransaction) {
        // Recharger les transactions pour refléter les changements
        await loadTransactions();

        // Reset form
        setTransactionForm({
          date: new Date().toISOString().split('T')[0],
          description: '',
          type: 'income',
          amount: '',
          category: ''
        });

        alert('Transaction enregistrée avec succès !');
      } else {
        alert('Erreur lors de l\'enregistrement de la transaction.');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la transaction.');
    }
  };

  const getFilteredTransactions = () => {
    if (isAdmin && selectedGroup !== 'all') {
      return transactions.filter(t => t.groupName === selectedGroup);
    } else if (!isAdmin && userGroup && userGroup !== 'Non défini') {
      return transactions.filter(t => t.groupName === userGroup);
    }
    return transactions;
  };

  const getGroupBalances = () => {
    const balances: { [groupName: string]: number } = {};

    // Initialiser tous les groupes à 0
    YOUTH_GROUPS.forEach(group => {
      balances[group] = 0;
    });

    // Calculer le solde pour chaque groupe en utilisant toutes les transactions
    transactions.forEach(transaction => {
      if (balances.hasOwnProperty(transaction.groupName)) {
        if (transaction.type === 'income') {
          balances[transaction.groupName] += transaction.amount;
        } else {
          balances[transaction.groupName] -= transaction.amount;
        }
      }
    });

    return balances;
  };

  const calculateBalance = (transactions: FinancialTransaction[]) => {
    return FinancialService.calculateGroupBalance(transactions);
  };

  const getRunningBalance = (index: number, filteredTransactions: FinancialTransaction[]) => {
    return FinancialService.calculateRunningBalance(filteredTransactions, index);
  };

  const generateMonthlyReport = (month: string, year: string) => {
    const groupName = isAdmin ? (selectedGroup === 'all' ? undefined : selectedGroup) : userGroup;
    return FinancialService.generateMonthlyReport(
      getFilteredTransactions(),
      parseInt(month),
      parseInt(year),
      groupName
    );
  };

  const exportToExcel = () => {
    const filteredTransactions = getFilteredTransactions();
    const csvContent = [
      ['Date', 'Libellé', 'Recette (FCFA)', 'Dépense (FCFA)', 'Solde (FCFA)', 'Catégorie', 'Groupe'],
      ...filteredTransactions.map((t, index) => [
        new Date(t.date).toLocaleDateString('fr-FR'),
        t.description,
        t.type === 'income' ? t.amount : '',
        t.type === 'expense' ? t.amount : '',
        getRunningBalance(index, filteredTransactions),
        t.category || '',
        t.groupName
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comptabilite_${isAdmin ? (selectedGroup === 'all' ? 'tous_groupes' : selectedGroup) : (userGroup || 'non_defini')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearAllTransactions = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les transactions de TOUS les groupes. Cette action est IRRÉVERSIBLE. Êtes-vous sûr de vouloir continuer ?')) {
      return;
    }

    if (!confirm('🔴 DERNIER AVERTISSEMENT: Toutes les données financières seront perdues. Confirmer la suppression ?')) {
      return;
    }

    try {
      // Supprimer toutes les transactions de Supabase
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tous les enregistrements

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des données');
        return;
      }

      // Recharger les transactions (devrait être vide)
      await loadTransactions();

      // Réinitialiser le statut de la base de données
      setDatabaseStatus({ hasData: false, transactionCount: 0 });

      alert('✅ Toutes les transactions ont été supprimées. Le solde est maintenant à 0.');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression des données');
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const currentBalance = calculateBalance(filteredTransactions);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement de la comptabilité...</span>
      </div>
    );
  }

  // Vérifier si le responsable de groupe a un groupe défini
  if (!isAdmin && (!userGroup || userGroup === 'Non défini')) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Erreur de Configuration</h3>
          </div>
          <div className="px-6 py-4">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <Calculator className="w-16 h-16 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Groupe non défini</h4>
              <p className="text-gray-600 mb-4">
                Votre groupe n'est pas défini dans votre profil. Veuillez contacter l'administrateur ou vous reconnecter.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Calculator className="w-6 h-6 mr-2 text-green-600" />
              Comptabilité des Groupes de Jeunesse
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Données Réelles
              </span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rapports
            </button>
          </div>

          {/* Information sur les données */}
          <div className={`mb-6 border rounded-lg p-4 ${
            !databaseStatus.hasData
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <div className={`${!databaseStatus.hasData ? 'text-green-600' : 'text-blue-600'} mr-3`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {!databaseStatus.hasData
                    ? '✅ Données Réelles - Base Vide'
                    : '📊 Données Réelles - Transactions Existantes'
                  }
                </h4>
                <p className="text-sm">
                  {!databaseStatus.hasData ? (
                    <span className="text-green-700">
                      Le système utilise Supabase avec des données réelles. La base est vide (solde = 0).
                      {isAdmin ? ' Vous voyez les données de tous les groupes.' : ' Vous voyez uniquement les données de votre groupe.'}
                    </span>
                  ) : (
                    <span className="text-blue-700">
                      <strong>{databaseStatus.transactionCount} transaction{databaseStatus.transactionCount > 1 ? 's' : ''}</strong> trouvée{databaseStatus.transactionCount > 1 ? 's' : ''}.
                      {databaseStatus.lastTransaction && (
                        <span className="block text-xs mt-1">
                          Dernière transaction: {databaseStatus.lastTransaction}
                        </span>
                      )}
                      {isAdmin ? ' Données de tous les groupes.' : ' Données de votre groupe uniquement.'}
                      {isAdmin && (
                        <span className="block mt-1 text-xs text-red-600">
                          💡 Pour remettre le solde à 0, utilisez le bouton "Vider Base" (⚠️ Irréversible)
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Group Filter for Admin */}
          {isAdmin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par groupe</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les groupes</option>
                {YOUTH_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Balance Display */}
          <div className={`p-4 rounded-lg mb-6 ${
            !databaseStatus.hasData
              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">Solde Actuel</h4>
                <p className="opacity-90">
                  {isAdmin && selectedGroup !== 'all' ? `Groupe ${selectedGroup}` : isAdmin ? 'Tous les groupes' : `Groupe ${userGroup || 'Non défini'}`}
                </p>
                {!databaseStatus.hasData ? (
                  <p className="text-xs opacity-80 mt-1">
                    ✅ Base vide - Solde nul normal
                  </p>
                ) : (
                  <p className="text-xs opacity-80 mt-1">
                    📊 Basé sur {databaseStatus.transactionCount} transaction{databaseStatus.transactionCount > 1 ? 's' : ''}
                    {databaseStatus.lastTransaction && (
                      <span className="block">Dernière: {databaseStatus.lastTransaction}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentBalance.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-sm opacity-90">
                  {currentBalance >= 0 ? '✓ Solde positif' : '⚠ Solde négatif'}
                  {!databaseStatus.hasData && ' (Base vide)'}
                </p>
              </div>
            </div>
          </div>

          {/* Group Balances Overview for Admin */}
          {isAdmin && selectedGroup === 'all' && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Soldes par Groupe
                {transactions.length === 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Base vide - Soldes nuls normaux
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(getGroupBalances()).map(([groupName, balance]) => (
                  <div key={groupName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800">{groupName}</h5>
                        <p className="text-sm text-gray-600">Solde actuel</p>
                        {balance === 0 && transactions.length === 0 && (
                          <p className="text-xs text-green-600 mt-1">💡 Base vide</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance.toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className={`text-xs ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {balance >= 0 ? '✓ Positif' : '⚠ Négatif'}
                          {balance === 0 && transactions.length === 0 && ' (Vide)'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Add Transaction Form */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouvelle Transaction
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="income">Recette</option>
                      <option value="expense">Dépense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                    <input
                      type="number"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Libellé *</label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description de l'opération"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie (optionnel)</label>
                    <input
                      type="text"
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="cotisation, achat matériel, don..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmitTransaction}
                    disabled={!transactionForm.description || !transactionForm.amount}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Enregistrer la Transaction
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h5 className="text-lg font-semibold text-gray-800">Historique des Transactions</h5>
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FileSpreadsheet size={18} className="mr-2" />
                    Exporter Excel
                  </button>
                  {isAdmin && (
                    <button
                      onClick={clearAllTransactions}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      title="⚠️ Supprimer TOUTES les transactions"
                    >
                      <Trash2 size={18} className="mr-2" />
                      Vider Base
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Libellé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recette (FCFA)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dépense (FCFA)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Solde (FCFA)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catégorie
                        </th>
                        {isAdmin && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Groupe
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction, index) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {transaction.type === 'income' ? transaction.amount.toLocaleString('fr-FR') : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                            {transaction.type === 'expense' ? transaction.amount.toLocaleString('fr-FR') : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <span className={getRunningBalance(index, filteredTransactions) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {getRunningBalance(index, filteredTransactions).toLocaleString('fr-FR')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.category || '-'}
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.groupName}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {!databaseStatus.hasData ? 'Base de données vide' : 'Aucune transaction trouvée'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {!databaseStatus.hasData ? (
                          <>
                            Le système utilise des données réelles. Le solde commence à 0.
                            <br />
                            Ajoutez votre première transaction pour commencer.
                          </>
                        ) : (
                          <>
                            Aucune transaction ne correspond aux filtres sélectionnés.
                            <br />
                            Essayez de changer les filtres ou ajoutez une nouvelle transaction.
                          </>
                        )}
                      </p>
                      <div className={`border rounded-lg p-4 max-w-md mx-auto ${
                        !databaseStatus.hasData
                          ? 'bg-green-50 border-green-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <p className={`text-sm ${
                          !databaseStatus.hasData ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          <strong>Solde actuel : {currentBalance.toLocaleString('fr-FR')} FCFA</strong>
                          <br />
                          {!databaseStatus.hasData
                            ? 'Base de données vide = solde nul (normal)'
                            : `${databaseStatus.transactionCount} transaction${databaseStatus.transactionCount > 1 ? 's' : ''} dans la base`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Rapports Financiers</h4>

              {/* Global Summary for Admin */}
              {isAdmin && selectedGroup === 'all' && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
                  <h5 className="text-xl font-semibold mb-4">Résumé Global de Tous les Groupes</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      const groupBalances = getGroupBalances();
                      const totalIncome = transactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                      const totalExpenses = transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                      const totalBalance = totalIncome - totalExpenses;
                      const positiveGroups = Object.values(groupBalances).filter(balance => balance >= 0).length;
                      const negativeGroups = Object.values(groupBalances).filter(balance => balance < 0).length;

                      return (
                        <>
                          <div className="text-center">
                            <p className="text-blue-100 text-sm">Total Recettes</p>
                            <p className="text-2xl font-bold">{totalIncome.toLocaleString('fr-FR')} FCFA</p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-100 text-sm">Total Dépenses</p>
                            <p className="text-2xl font-bold">{totalExpenses.toLocaleString('fr-FR')} FCFA</p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-100 text-sm">Solde Global</p>
                            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {totalBalance.toLocaleString('fr-FR')} FCFA
                            </p>
                            <p className="text-xs text-blue-200 mt-1">
                              {positiveGroups} groupes positifs • {negativeGroups} groupes négatifs
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Monthly Report Generator */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h5 className="text-lg font-semibold text-gray-800 mb-4">Générer un Rapport Mensuel</h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleDateString('fr-FR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={2025 + i} value={2025 + i}>
                          {2025 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => { const report = generateMonthlyReport(selectedMonth, selectedYear); setMonthlyReport(report); }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Générer Rapport
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Report Display */}
              {monthlyReport && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Rapport Mensuel - {monthlyReport.period}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-green-600 font-semibold">Total Recettes</p>
                      <p className="text-2xl font-bold">{monthlyReport.totalIncome.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-600 font-semibold">Total Dépenses</p>
                      <p className="text-2xl font-bold">{monthlyReport.totalExpenses.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold ${monthlyReport.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Solde</p>
                      <p className="text-2xl font-bold">{monthlyReport.balance.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">Nombre de transactions: {monthlyReport.transactions.length}</p>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <h5 className="text-lg font-semibold text-green-800">Total Recettes</h5>
                      <p className="text-2xl font-bold text-green-600">
                        {filteredTransactions
                          .filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <h5 className="text-lg font-semibold text-red-800">Total Dépenses</h5>
                      <p className="text-2xl font-bold text-red-600">
                        {filteredTransactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Calculator className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <h5 className="text-lg font-semibold text-blue-800">Solde</h5>
                      <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentBalance.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingManager;