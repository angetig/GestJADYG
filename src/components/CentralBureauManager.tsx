import React, { useState, useEffect } from 'react';
import { CentralBureau, CentralBureauMember } from '../types';
import { CentralBureauService } from '../utils/centralBureauService';
import { Crown, UserPlus, Edit, Trash2, Save, X, Users } from 'lucide-react';

const CentralBureauManager: React.FC = () => {
  const [bureau, setBureau] = useState<CentralBureau | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  // Form states
  const [newMember, setNewMember] = useState({
    nomPrenom: '',
    role: '',
    contact: '',
    email: ''
  });

  const [editMember, setEditMember] = useState({
    nomPrenom: '',
    role: '',
    contact: '',
    email: ''
  });

  useEffect(() => {
    loadBureau();
  }, []);

  const loadBureau = async () => {
    setLoading(true);
    try {
      const bureauData = await CentralBureauService.getCentralBureau();
      if (!bureauData) {
        // Créer un bureau par défaut
        const defaultBureau = await CentralBureauService.saveCentralBureau({
          name: 'Bureau Central JADYG',
          description: 'Équipe dirigeante centrale de la JADYG',
          members: []
        });
        setBureau(defaultBureau);
      } else {
        setBureau(bureauData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du bureau:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.nomPrenom || !newMember.role) return;

    try {
      const addedMember = await CentralBureauService.addBureauMember(newMember);
      if (addedMember) {
        await loadBureau();
        setShowAddModal(false);
        setNewMember({ nomPrenom: '', role: '', contact: '', email: '' });
        alert('Membre ajouté avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const handleEditMember = (member: CentralBureauMember) => {
    setEditingMember(member.id);
    setEditMember({
      nomPrenom: member.nomPrenom,
      role: member.role,
      contact: member.contact || '',
      email: member.email || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;

    try {
      const success = await CentralBureauService.updateBureauMember(editingMember, editMember);
      if (success) {
        await loadBureau();
        setEditingMember(null);
        alert('Membre modifié avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification du membre');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre du bureau central ?')) return;

    try {
      const success = await CentralBureauService.removeBureauMember(memberId);
      if (success) {
        await loadBureau();
        alert('Membre retiré avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du membre');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du bureau central...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Crown className="w-8 h-8 mr-3" />
              Bureau Central JADYG
            </h2>
            <p className="text-purple-100 mt-1">
              Équipe dirigeante centrale • {bureau?.members.length || 0} membre{bureau?.members.length !== 1 ? 's' : ''}
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
            Membres du Bureau Central ({bureau?.members.length || 0})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {bureau && bureau.members.length > 0 ? (
            bureau.members.map((member) => (
              <div key={member.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Member Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-bold">
                        {member.nomPrenom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      {editingMember === member.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editMember.nomPrenom}
                              onChange={(e) => setEditMember(prev => ({ ...prev, nomPrenom: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Nom et prénom"
                            />
                            <input
                              type="text"
                              value={editMember.role}
                              onChange={(e) => setEditMember(prev => ({ ...prev, role: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Rôle"
                            />
                            <input
                              type="text"
                              value={editMember.contact}
                              onChange={(e) => setEditMember(prev => ({ ...prev, contact: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Contact"
                            />
                            <input
                              type="email"
                              value={editMember.email}
                              onChange={(e) => setEditMember(prev => ({ ...prev, email: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Email"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                            >
                              <Save size={14} className="mr-1" />
                              Sauver
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                            >
                              <X size={14} className="mr-1" />
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-medium text-gray-800">{member.nomPrenom}</h4>
                          <p className="text-sm text-purple-600 font-medium flex items-center">
                            <Crown className="w-4 h-4 mr-1" />
                            {member.role}
                          </p>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            {member.contact && (
                              <div>📞 {member.contact}</div>
                            )}
                            {member.email && (
                              <div>✉️ {member.email}</div>
                            )}
                            <div className="text-xs text-gray-400">
                              Membre depuis le {new Date(member.assignedAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {editingMember !== member.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Modifier le membre"
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
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre dans le bureau central</h3>
              <p className="text-gray-600 mb-4">Commencez par ajouter des membres à l'équipe dirigeante</p>
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
              <h3 className="text-lg font-semibold">Ajouter un membre au bureau central</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom et prénom *
                  </label>
                  <input
                    type="text"
                    value={newMember.nomPrenom}
                    onChange={(e) => setNewMember(prev => ({ ...prev, nomPrenom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle *
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="Président">Président</option>
                    <option value="Vice-Président">Vice-Président</option>
                    <option value="Trésorier">Trésorier</option>
                    <option value="Secrétaire">Secrétaire</option>
                    <option value="Trésorier Adjoint">Trésorier Adjoint</option>
                    <option value="Secrétaire Adjoint">Secrétaire Adjoint</option>
                    <option value="Conseiller">Conseiller</option>
                    <option value="Responsable Technique">Responsable Technique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newMember.contact}
                    onChange={(e) => setNewMember(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Numéro de téléphone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="adresse@email.com"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewMember({ nomPrenom: '', role: '', contact: '', email: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMember.nomPrenom || !newMember.role}
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

export default CentralBureauManager;