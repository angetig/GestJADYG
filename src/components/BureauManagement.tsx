import React, { useState, useEffect } from 'react';
import { YouthData, Bureau, BureauMember } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { Users, UserPlus, Crown, Edit, Trash2, Save, X } from 'lucide-react';

interface BureauManagementProps {
  groupName: string;
}

const BureauManagement: React.FC<BureauManagementProps> = ({ groupName }) => {
  const [groupMembers, setGroupMembers] = useState<YouthData[]>([]);
  const [bureau, setBureau] = useState<Bureau | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<YouthData | null>(null);
  const [newRole, setNewRole] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    loadData();
  }, [groupName]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load group members
      const members = await GroupAssignmentService.getGroupMembers(groupName);
      setGroupMembers(members);

      // Load bureau data (in real app, this would come from API)
      // For now, we'll check if there's existing bureau data in localStorage
      const savedBureau = localStorage.getItem(`bureau_${groupName}`);
      if (savedBureau) {
        setBureau(JSON.parse(savedBureau));
      } else {
        // No bureau exists yet
        setBureau(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    if (!selectedMember || !newRole.trim()) return;

    const newBureauMember: BureauMember = {
      id: Date.now().toString(),
      youthId: selectedMember.id,
      role: newRole.trim(),
      assignedAt: new Date().toISOString()
    };

    let updatedBureau: Bureau;

    if (bureau) {
      updatedBureau = {
        ...bureau,
        members: [...bureau.members, newBureauMember],
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new bureau
      updatedBureau = {
        id: Date.now().toString(),
        groupName,
        members: [newBureauMember],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    setBureau(updatedBureau);
    localStorage.setItem(`bureau_${groupName}`, JSON.stringify(updatedBureau));

    setShowAddModal(false);
    setSelectedMember(null);
    setNewRole('');
  };

  const handleEditRole = (memberId: string) => {
    if (bureau) {
      const updatedMembers = bureau.members.map(member =>
        member.id === memberId
          ? { ...member, role: editRole }
          : member
      );

      const updatedBureau = {
        ...bureau,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      setBureau(updatedBureau);
      localStorage.setItem(`bureau_${groupName}`, JSON.stringify(updatedBureau));
    }

    setEditingMember(null);
    setEditRole('');
  };

  const handleRemoveMember = (memberId: string) => {
    if (bureau && confirm('Êtes-vous sûr de vouloir retirer ce membre du bureau ?')) {
      const updatedMembers = bureau.members.filter(member => member.id !== memberId);
      const updatedBureau = {
        ...bureau,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      setBureau(updatedBureau);
      localStorage.setItem(`bureau_${groupName}`, JSON.stringify(updatedBureau));
    }
  };

  const getMemberDetails = (youthId: string): YouthData | undefined => {
    return groupMembers.find(member => member.id === youthId);
  };

  const getAvailableMembers = (): YouthData[] => {
    if (!bureau) return groupMembers;

    const bureauMemberIds = bureau.members.map(member => member.youthId);
    return groupMembers.filter(member => !bureauMemberIds.includes(member.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du bureau...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Crown className="w-8 h-8 mr-3" />
              Bureau du Groupe {groupName}
            </h2>
            <p className="text-purple-100 mt-1">
              Gérez les membres du bureau et leurs rôles
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center font-medium"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter Membre
          </button>
        </div>
      </div>

      {/* Bureau Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-600" />
            Membres du Bureau ({bureau?.members.length || 0})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {bureau && bureau.members.length > 0 ? (
            bureau.members.map((member) => {
              const memberDetails = getMemberDetails(member.youthId);
              return (
                <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Member Photo */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {memberDetails?.photo ? (
                          <img
                            src={URL.createObjectURL(memberDetails.photo)}
                            alt={memberDetails.nomPrenom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm font-medium">
                            {(memberDetails?.nomPrenom || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {memberDetails?.nomPrenom || 'Membre inconnu'}
                        </h4>
                        {editingMember === member.id ? (
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                              placeholder="Nouveau rôle"
                            />
                            <button
                              onClick={() => handleEditRole(member.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-purple-600 font-medium flex items-center">
                            <Crown className="w-4 h-4 mr-1" />
                            {member.role}
                          </p>
                        )}
                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                          {memberDetails?.contact1 && (
                            <div>📞 {memberDetails.contact1}</div>
                          )}
                          {memberDetails?.contact2 && (
                            <div>📞 {memberDetails.contact2}</div>
                          )}
                          {memberDetails?.quartierResidence && (
                            <div>📍 {memberDetails.quartierResidence}</div>
                          )}
                          {memberDetails && (
                            <div className="text-xs text-gray-400">
                              {memberDetails.genre}, {memberDetails.trancheAge} ans • {memberDetails.statutMatrimonial}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingMember(member.id);
                          setEditRole(member.role);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Modifier le rôle"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Retirer du bureau"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre dans le bureau</h3>
              <p className="text-gray-600 mb-4">Commencez par ajouter des membres au bureau</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ajouter le premier membre
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Ajouter un membre au bureau</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un membre
                  </label>
                  <select
                    value={selectedMember?.id || ''}
                    onChange={(e) => {
                      const member = groupMembers.find(m => m.id === e.target.value);
                      setSelectedMember(member || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choisir un membre...</option>
                    {getAvailableMembers().map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.nomPrenom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle dans le bureau
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Président, Secrétaire, Trésorier..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedMember(null);
                  setNewRole('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedMember || !newRole.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BureauManagement;