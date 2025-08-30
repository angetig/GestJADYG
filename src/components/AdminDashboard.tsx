import React, { useState, useEffect } from 'react';
import { YouthData, GroupStats, YOUTH_GROUPS, EventRequest } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { ExcelExportService } from '../utils/excelExport';
import { AuthService } from '../utils/auth';
import { Users, BarChart3, UserCheck, Settings, LogOut, FileSpreadsheet, Download, UsersIcon, Eye, Calendar, CheckCircle, XCircle, Clock, Edit, Crown } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [registrations, setRegistrations] = useState<YouthData[]>([]);
  const [stats, setStats] = useState<GroupStats>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<YouthData[]>([]);
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [bureaux, setBureaux] = useState<any[]>([]);
  const [selectedBureau, setSelectedBureau] = useState<any | null>(null);
  const [showBureauModal, setShowBureauModal] = useState(false);

  useEffect(() => {
    loadData();
    loadEvents();
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

  const loadEvents = () => {
    // Mock events data for all groups
    const mockEvents: EventRequest[] = [
      {
        id: '1',
        title: 'Réunion de prière',
        date: '2025-09-15',
        time: '19:00',
        location: 'Salle paroissiale',
        objectives: 'Prière collective',
        description: 'Réunion de prière pour la communauté',
        status: 'approved',
        groupName: 'Disciples',
        submittedAt: '2025-08-30T10:00:00Z',
        adminComment: 'Bien organisé'
      },
      {
        id: '2',
        title: 'Sortie culturelle',
        date: '2025-09-20',
        time: '14:00',
        location: 'Musée',
        objectives: 'Découverte culturelle',
        description: 'Visite du musée local',
        status: 'pending',
        groupName: 'Les Élus',
        submittedAt: '2025-08-29T15:00:00Z'
      },
      {
        id: '3',
        title: 'Atelier formation',
        date: '2025-09-10',
        time: '18:00',
        location: 'Centre communautaire',
        objectives: 'Formation spirituelle',
        description: 'Atelier sur la Bible',
        status: 'rejected',
        groupName: 'Sel et Lumière',
        submittedAt: '2025-08-28T12:00:00Z',
        rejectionComment: 'Budget trop élevé, ajuster à 50000 FCFA'
      }
    ];
    setEvents(mockEvents);
  };

  const getStatusDisplay = (status: EventRequest['status']) => {
    switch (status) {
      case 'draft':
        return { text: 'Brouillon', icon: Edit, color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'pending':
        return { text: 'En attente', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'approved':
        return { text: 'Validé', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'rejected':
        return { text: 'Refusé', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: status, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
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

  const renderEvents = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Gestion des Événements</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom de l'événement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Groupe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date prévue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commentaires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => {
              const statusInfo = getStatusDisplay(event.status);
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.groupName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon size={14} className="mr-1" />
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {event.adminComment || event.rejectionComment || 'Aucun commentaire'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir
                      </button>
                      {event.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900">Valider</button>
                          <button className="text-red-600 hover:text-red-900">Refuser</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun événement pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderBureaux = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Gestion des Bureaux</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Groupe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membres du Bureau
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Mock bureaux data */}
            {[
              {
                id: '1',
                groupName: 'Disciples',
                members: [
                  { role: 'Président', name: 'Jean Dupont' },
                  { role: 'Secrétaire', name: 'Marie Martin' },
                  { role: 'Trésorier', name: 'Pierre Durand' }
                ],
                createdAt: '2025-01-15T10:00:00Z'
              },
              {
                id: '2',
                groupName: 'Les Élus',
                members: [
                  { role: 'Président', name: 'Sophie Leroy' },
                  { role: 'Secrétaire', name: 'Marc Dubois' }
                ],
                createdAt: '2025-01-20T14:00:00Z'
              }
            ].map((bureau) => (
              <tr key={bureau.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bureau.groupName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="space-y-1">
                    {bureau.members.map((member, index) => (
                      <div key={index} className="flex items-center">
                        <Crown className="w-3 h-3 mr-1 text-yellow-500" />
                        <span className="font-medium">{member.role}:</span>
                        <span className="ml-1">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(bureau.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedBureau(bureau);
                      setShowBureauModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Voir détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bureaux.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Crown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun bureau créé pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'registrations', label: 'Inscriptions', icon: Users },
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'bureaux', label: 'Bureaux', icon: Crown },
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
                onClick={() => window.location.href = '/event-request'}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Calendar size={18} className="mr-2" />
                Créer Événement
              </button>
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
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'bureaux' && renderBureaux()}
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

      {/* Modal pour les détails de l'événement */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Détails de l'événement</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Titre</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Groupe</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.groupName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedEvent.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Heure</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.time}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lieu</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(selectedEvent.status).bg} ${getStatusDisplay(selectedEvent.status).color}`}>
                        {React.createElement(getStatusDisplay(selectedEvent.status).icon, { size: 14, className: "mr-1" })}
                        {getStatusDisplay(selectedEvent.status).text}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Objectifs</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEvent.objectives}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEvent.description}</p>
                </div>

                {selectedEvent.budget && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget estimé</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEvent.budget} FCFA</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Soumis le</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedEvent.submittedAt).toLocaleDateString('fr-FR')} à {new Date(selectedEvent.submittedAt).toLocaleTimeString('fr-FR')}</p>
                </div>

                {(selectedEvent.adminComment || selectedEvent.rejectionComment) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Commentaires Admin</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedEvent.adminComment && (
                        <p className="text-sm text-gray-900">{selectedEvent.adminComment}</p>
                      )}
                      {selectedEvent.rejectionComment && (
                        <p className="text-sm text-red-600 mt-2">{selectedEvent.rejectionComment}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Fermer
                </button>
                {selectedEvent.status === 'pending' && (
                  <>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
                      Valider
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                      Refuser
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour les détails du bureau */}
      {showBureauModal && selectedBureau && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                  Bureau du Groupe {selectedBureau.groupName}
                </h3>
                <button
                  onClick={() => setShowBureauModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Membres</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{selectedBureau.members.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Créé le</span>
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {new Date(selectedBureau.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Crown className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">Statut</span>
                    </div>
                    <p className="text-sm font-medium text-purple-600 mt-1">Actif</p>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-800 mb-4">Membres du Bureau</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedBureau.members.map((member: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start space-x-4">
                      {/* Member Photo */}
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-gray-400 text-lg font-medium">
                          {member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Member Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <h5 className="text-lg font-semibold text-gray-900 mr-2">{member.name}</h5>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            {member.role}
                          </span>
                        </div>

                        {/* Mock contact information */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            +225 XX XX XX XX
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {member.name.toLowerCase().replace(' ', '.')}@example.com
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Abidjan, Côte d'Ivoire
                          </div>
                        </div>

                        {/* Additional info */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Assigné le {new Date().toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBureauModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;