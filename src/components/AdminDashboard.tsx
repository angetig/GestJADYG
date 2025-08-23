import React, { useState, useEffect } from 'react';
import { YouthData, GroupStats, YOUTH_GROUPS } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { ExcelExportService } from '../utils/excelExport';
import { AuthService } from '../utils/auth';
import { Users, BarChart3, UserCheck, Settings, LogOut, FileSpreadsheet, Download, UsersIcon, Eye } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [registrations, setRegistrations] = useState<YouthData[]>([]);
  const [stats, setStats] = useState<GroupStats>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<YouthData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await GroupAssignmentService.getStoredData();
      const groupStats = await GroupAssignmentService.calculateGroupStats();
      setRegistrations(data);
      setStats(groupStats);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const clearAllData = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ?')) {
      try {
        await GroupAssignmentService.clearAllData();
        loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const loadGroupMembers = async (groupName: string) => {
    try {
      const members = await GroupAssignmentService.getGroupMembers(groupName);
      setGroupMembers(members);
      setSelectedGroup(groupName);
      setActiveTab('group-members');
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      console.error('Erreur lors de la récupération des membres:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la récupération des membres: ${errorMessage}`);
    }
  };

  const exportData = () => {
    ExcelExportService.exportAllRegistrations(registrations);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(registrations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inscriptions-jeunesse.json';
    link.click();
  };

  const exportGroupData = (groupName: string, members: YouthData[]) => {
    ExcelExportService.exportGroupData(members, groupName);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Inscrits</h3>
          <p className="text-3xl font-bold text-blue-600">{registrations.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Groupes Actifs</h3>
          <p className="text-3xl font-bold text-green-600">
            {Object.values(stats).filter(s => s.total > 0).length}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Moyenne par Groupe</h3>
          <p className="text-3xl font-bold text-purple-600">
            {registrations.length > 0 ? Math.round(registrations.length / 10) : 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition par Groupe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(stats).map(([group, groupStats]) => (
            <div key={group} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">{group}</h4>
                <button
                  onClick={() => loadGroupMembers(group)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  title="Voir les membres"
                >
                  <Eye size={16} />
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Total: <span className="font-medium">{groupStats.total}</span></p>
                <p>Mariés: {groupStats.maries} | Célibataires: {groupStats.celibataires}</p>
                <p>Hommes: {groupStats.hommes} | Femmes: {groupStats.femmes}</p>
                <p>Travailleurs: {groupStats.travailleurs} | Étudiants: {groupStats.etudiants} | Sans emploi: {groupStats.sansEmploi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGroupMembers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Groupe : {selectedGroup}</h3>
          <p className="text-gray-600">{groupMembers.length} membre(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportGroupData(selectedGroup!, groupMembers)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FileSpreadsheet size={18} className="mr-2" />
            Exporter Excel
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom et Prénom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Genre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quartier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Situation Pro.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Inscription
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupMembers.map((youth) => (
                <tr key={youth.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {youth.photo ? (
                        <img
                          src={URL.createObjectURL(youth.photo)}
                          alt={youth.nomPrenom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">
                          {(youth.nomPrenom || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {youth.nomPrenom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {youth.genre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {youth.trancheAge}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{youth.contact1}</div>
                      {youth.contact2 && (
                        <div className="text-xs text-gray-400">{youth.contact2}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {youth.quartierResidence}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {youth.statutMatrimonial}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{youth.situationProfessionnelle}</div>
                      {youth.typeTravail && (
                        <div className="text-xs text-gray-400">{youth.typeTravail}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(youth.dateInscription).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {groupMembers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun membre dans ce groupe pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRegistrations = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Toutes les Inscriptions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom et Prénom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Genre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Âge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Situation Pro.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Groupe Assigné
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.map((youth) => (
              <tr key={youth.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {youth.photo ? (
                      <img
                        src={URL.createObjectURL(youth.photo)}
                        alt={youth.nomPrenom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">
                        {(youth.nomPrenom || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {youth.nomPrenom}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {youth.genre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {youth.trancheAge}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {youth.statutMatrimonial}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {youth.situationProfessionnelle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {youth.groupeAssigne}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'registrations', label: 'Inscriptions', icon: Users },
    { id: 'group-members', label: selectedGroup ? `Groupe ${selectedGroup}` : 'Membres par groupe', icon: UsersIcon },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">GestJADYG - Administration</h1>
              <p className="text-gray-600">Espace Administrateur</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Excel
              </button>
              <button
                onClick={exportJSON}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download size={18} className="mr-2" />
                JSON
              </button>
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Effacer tout
              </button>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <LogOut size={18} className="mr-2" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Ne pas afficher l'onglet group-members si aucun groupe n'est sélectionné
            if (tab.id === 'group-members' && !selectedGroup) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'registrations' && renderRegistrations()}
        {activeTab === 'group-members' && renderGroupMembers()}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Paramètres</h3>
            <p className="text-gray-600 mb-4">Gestion des données et configuration du système.</p>
            <div className="space-y-4">
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mr-4 flex items-center"
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Exporter Excel
              </button>
              <button
                onClick={exportJSON}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-4 flex items-center"
              >
                <Download size={18} className="mr-2" />
                Exporter JSON
              </button>
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer toutes les données
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;