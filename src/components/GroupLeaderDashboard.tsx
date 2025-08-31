import React, { useState, useEffect } from 'react';
import { YouthData, EventRequest } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { ExcelExportService } from '../utils/excelExport';
import { AuthService } from '../utils/auth';
import { Users, UserCheck, Calendar, Phone, MapPin, Briefcase, GraduationCap, Heart, Church, LogOut, FileSpreadsheet, Plus, CheckCircle, XCircle, Clock, Edit, Crown, Calculator } from 'lucide-react';
import BureauManagement from './BureauManagement';
import NotificationCenter from './NotificationCenter';
import SocialCasesManager from './SocialCasesManager';
import AccountingManager from './AccountingManager';

interface GroupLeaderDashboardProps {
  onLogout: () => void;
}

const GroupLeaderDashboard: React.FC<GroupLeaderDashboardProps> = ({ onLogout }) => {
  const [groupMembers, setGroupMembers] = useState<YouthData[]>([]);
  const [selectedMember, setSelectedMember] = useState<YouthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSocialCasesModal, setShowSocialCasesModal] = useState(false);
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  
  // Récupérer le nom du groupe avec plus de débogage
  const currentUser = AuthService.getCurrentUser();
  const groupName = currentUser?.groupName;
  
  console.log('GroupLeaderDashboard - currentUser:', currentUser);
  console.log('GroupLeaderDashboard - groupName:', groupName);

  useEffect(() => {
    if (groupName) {
      console.log('useEffect - Chargement des membres pour:', groupName);
      loadGroupMembers();
      loadEvents();
    } else {
      console.log('useEffect - Pas de nom de groupe, utilisateur:', currentUser);
      setError('Nom du groupe non trouvé');
      setLoading(false);
    }
  }, [groupName]);

  const loadEvents = () => {
    // Mock events data
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
        groupName: groupName || '',
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
        groupName: groupName || '',
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
        status: 'draft',
        groupName: groupName || '',
        submittedAt: '2025-08-28T12:00:00Z'
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

  const loadGroupMembers = async () => {
    if (!groupName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Chargement des membres pour le groupe:', groupName);
      const members = await GroupAssignmentService.getGroupMembers(groupName);
      console.log('Membres chargés:', members);
      setGroupMembers(members);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      setError(`Erreur lors du chargement des membres: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const getGroupStats = () => {
    const total = groupMembers.length;
    const maries = groupMembers.filter(m => m.statutMatrimonial === 'Marié(e)').length;
    const celibataires = groupMembers.filter(m => m.statutMatrimonial === 'Célibataire').length;
    const travailleurs = groupMembers.filter(m => m.situationProfessionnelle === 'Travailleur').length;
    const etudiants = groupMembers.filter(m => m.situationProfessionnelle === 'Étudiant(e)').length;
    const sansEmploi = groupMembers.filter(m => m.situationProfessionnelle === 'Sans emploi').length;
    const hommes = groupMembers.filter(m => m.genre === 'Homme').length;
    const femmes = groupMembers.filter(m => m.genre === 'Femme').length;

    return { total, maries, celibataires, travailleurs, etudiants, sansEmploi, hommes, femmes };
  };

  const stats = getGroupStats();

  const exportGroupData = () => {
    if (groupName && groupMembers.length > 0) {
      ExcelExportService.exportGroupData(groupMembers, groupName);
    } else {
      alert('Aucune donnée à exporter');
    }
  };

  // Afficher un message d'erreur si le groupe n'est pas trouvé
  if (!groupName) {
    console.log('Rendu: groupName est null/undefined');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-600 mb-4">
            <Users className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">
            Impossible de déterminer votre groupe.
            <br />
            <small className="text-gray-500">
              Utilisateur actuel: {JSON.stringify(AuthService.getCurrentUser())}
            </small>
          </p>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Responsable du Groupe : <span className="text-blue-600">{groupName || 'Non défini'}</span>
                  </h1>
                  <p className="text-gray-600">Vous gérez actuellement le groupe "{groupName || 'Non défini'}"</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <NotificationCenter recipientType="group_leader" groupName={groupName} />
              <button
                onClick={() => setShowSocialCasesModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Heart size={18} className="mr-2" />
                Cas Sociaux
              </button>
              <button
                onClick={() => setShowAccountingModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Calculator size={18} className="mr-2" />
                Comptabilité
              </button>
              <button
                onClick={() => window.location.href = '/event-request'}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Créer Événement
              </button>
              <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Connecté en tant que responsable</span>
              </div>
              <button
                onClick={exportGroupData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Excel
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
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Événements
            </button>
            <button
              onClick={() => setActiveTab('bureau')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'bureau'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="w-4 h-4 mr-2" />
              Bureau
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Membres
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Groupe {groupName || 'Non défini'}</h2>
                <p className="text-blue-100">
                  Vous êtes le responsable de ce groupe avec {stats.total} membre{stats.total > 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Membres</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Hommes / Femmes</h3>
            <p className="text-xl font-bold text-green-600">{stats.hommes} / {stats.femmes}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Mariés / Célibataires</h3>
            <p className="text-xl font-bold text-purple-600">{stats.maries} / {stats.celibataires}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Travailleurs</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.travailleurs}</p>
          </div>
          </div>
        </div>
        )}

        {activeTab === 'events' && (
          <div className="mb-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="mr-2 text-purple-600" />
                  Événements de votre groupe
                </div>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {events.length} événement{events.length > 1 ? 's' : ''}
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom de l'événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date prévue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commentaires Admin
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
        </div>
        )}

        {activeTab === 'bureau' && (
          <BureauManagement groupName={groupName || ''} />
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des membres */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                  <Users className="mr-2 text-blue-600" />
                    Membres de votre groupe "{groupName || 'Non défini'}"
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.total} membre{stats.total > 1 ? 's' : ''}
                  </span>
                </h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Chargement des membres...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-red-300" />
                  <p>{error}</p>
                  <button
                    onClick={loadGroupMembers}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMember?.id === member.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.nomPrenom}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={`https://ui-avatars.com/api/?name=User&background=${member.genre === 'Femme' ? 'f9c2ff' : 'b3d1ff'}&color=555555&size=64&gender=${member.genre === 'Femme' ? 'female' : 'male'}`}
                                alt={member.genre === 'Femme' ? 'Avatar féminin' : 'Avatar masculin'}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{member.nomPrenom ? member.nomPrenom : 'Nom inconnu'}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <span className="mr-4">{member.genre}</span>
                              <span className="mr-4">{member.trancheAge} ans</span>
                              <span>{member.statutMatrimonial}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{member.situationProfessionnelle}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {member.dateInscription && !isNaN(new Date(member.dateInscription).getTime())
                              ? new Date(member.dateInscription).toLocaleDateString()
                              : 'Date inconnue'}
                          </div>
                      </div>
                    </div>
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun membre dans ce groupe pour le moment</p>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Détails du membre sélectionné */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <UserCheck className="mr-2 text-green-600" />
                  Détails du Membre
                </h3>
              </div>
              <div className="p-6">
                {selectedMember ? (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto mb-3">
                        {selectedMember.photo ? (
                          <img
                            src={URL.createObjectURL(selectedMember.photo)}
                            alt={selectedMember.nomPrenom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-lg font-medium">
                            {(selectedMember.nomPrenom || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-lg text-gray-800">
                        {selectedMember.nomPrenom}
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedMember.genre}, {selectedMember.trancheAge} ans</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedMember.quartierResidence}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div>{selectedMember.contact1}</div>
                            {selectedMember.contact2 && (
                              <div className="text-gray-500">{selectedMember.contact2}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Heart className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedMember.statutMatrimonial}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div>{selectedMember.situationProfessionnelle}</div>
                            {selectedMember.typeTravail && (
                              <div className="text-gray-500">{selectedMember.typeTravail}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedMember.niveauEtude}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Church className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div>Conversion: {selectedMember.anneeConversion} ans</div>
                            <div className="text-gray-500">
                              Baptême eau: {selectedMember.baptemeEau} | 
                              Saint-Esprit: {selectedMember.baptemeSaintEsprit}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Inscrit le {new Date(selectedMember.dateInscription).toLocaleDateString()}</span>
                        </div>
                        
                        {selectedMember.messageJeunesse && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-700 mb-1">Message :</h5>
                            <p className="text-sm text-gray-600">{selectedMember.messageJeunesse}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Sélectionnez un membre pour voir ses détails</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Social Cases Manager Modal */}
      {showSocialCasesModal && (
        <SocialCasesManager onClose={() => setShowSocialCasesModal(false)} />
      )}

      {/* Accounting Manager Modal */}
      {showAccountingModal && (
        <AccountingManager onClose={() => setShowAccountingModal(false)} />
      )}
    </div>
  );
};

export default GroupLeaderDashboard;