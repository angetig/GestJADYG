import React, { useState, useEffect } from 'react';
import { MatriculeService } from '../utils/matriculeService';
import { FileSpreadsheet, RefreshCw, Search, User, Calendar, Hash, CheckCircle, AlertCircle } from 'lucide-react';

interface MatriculeManagerProps {
  onClose: () => void;
}

const MatriculeManager: React.FC<MatriculeManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assign' | 'search'>('overview');
  const [matriculeStats, setMatriculeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchMatricule, setSearchMatricule] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assigningMatricules, setAssigningMatricules] = useState(false);
  const [previewMatricules, setPreviewMatricules] = useState<string[]>([]);

  useEffect(() => {
    loadMatriculeStats();
    generatePreviewMatricules();
  }, []);

  const loadMatriculeStats = async () => {
    setLoading(true);
    try {
      const stats = await MatriculeService.getMatriculeStats();
      setMatriculeStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewMatricules = () => {
    const previews = MatriculeService.generateMatriculeSuggestions(10);
    setPreviewMatricules(previews);
  };

  const handleSearch = async () => {
    if (!searchMatricule.trim()) {
      setSearchResult(null);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await MatriculeService.findYouthByMatricule(searchMatricule.trim());
      setSearchResult(result);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssignExistingMatricules = async () => {
    if (!confirm('Cette action va attribuer des matricules à tous les jeunes qui n\'en ont pas encore. Continuer ?')) {
      return;
    }

    setAssigningMatricules(true);
    try {
      const count = await MatriculeService.assignMatriculesToExistingYouth();
      alert(`${count} matricule(s) attribué(s) avec succès !`);
      await loadMatriculeStats();
    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
      alert('Erreur lors de l\'attribution des matricules');
    } finally {
      setAssigningMatricules(false);
    }
  };

  const exportMatriculeReport = () => {
    const csvContent = [
      ['Matricule', 'Nom et Prénom', 'Groupe', 'Date d\'affectation'],
      ...matriculeStats.flatMap((stat: any) =>
        Array(stat.total_matricules).fill(null).map((_, i) => [
          `${stat.year_code}${String(i + 1).padStart(2, '0')}`,
          'Données à récupérer depuis la base',
          'Groupe à déterminer',
          stat.last_assignment || 'N/A'
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matricules_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des matricules...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Hash className="w-6 h-6 mr-2 text-blue-600" />
              Gestion des Matricules
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
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'assign'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Attribution
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Recherche
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Système de Matricule</h4>
                <p className="text-blue-700 text-sm">
                  Chaque jeune reçoit un matricule unique composé de 4 caractères :
                  <strong>AAYY</strong> où <strong>AA</strong> = année d'affectation,
                  <strong>YY</strong> = code alphanumérique unique.
                </p>
              </div>

              {/* Statistiques par année */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matriculeStats.map((stat: any) => (
                  <div key={stat.year_code} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Calendar size={20} className="text-blue-600 mr-2" />
                        <span className="font-semibold text-gray-800">
                          {MatriculeService.expandYearCode(stat.year_code)}
                        </span>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {stat.year_code}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Matricules :</span>
                        <span className="font-medium">{stat.total_matricules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Groupes :</span>
                        <span className="font-medium">{stat.groups_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dernière affectation :</span>
                        <span className="font-medium text-xs">
                          {stat.last_assignment ? new Date(stat.last_assignment).toLocaleDateString('fr-FR') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aperçu des matricules */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Aperçu des Matricules</h4>
                  <button
                    onClick={generatePreviewMatricules}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <RefreshCw size={16} className="inline mr-1" />
                    Régénérer
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {previewMatricules.map((matricule, index) => (
                    <div key={index} className="bg-gray-100 text-center py-2 px-3 rounded text-sm font-mono">
                      {MatriculeService.formatMatricule(matricule)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ces matricules sont générés automatiquement lors de l'affectation d'un jeune dans un groupe.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-800 mb-2">Attribution des Matricules</h4>
                <p className="text-green-700 text-sm">
                  Les matricules sont automatiquement attribués lors de l'affectation d'un jeune dans un groupe.
                  Utilisez cette section pour attribuer des matricules aux jeunes existants.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <User size={48} className="mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Attribution aux Jeunes Existants
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Cette action va attribuer des matricules uniques à tous les jeunes
                    qui ont un groupe assigné mais n'ont pas encore de matricule.
                  </p>
                  <button
                    onClick={handleAssignExistingMatricules}
                    disabled={assigningMatricules}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
                  >
                    {assigningMatricules ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Attribution en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Attribuer les Matricules
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-800 mb-2">Recherche par Matricule</h4>
                <p className="text-purple-700 text-sm">
                  Recherchez un jeune spécifique en utilisant son matricule unique.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={searchMatricule}
                      onChange={(e) => setSearchMatricule(e.target.value.toUpperCase())}
                      placeholder="Ex: 25A3"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={4}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searchLoading || !searchMatricule.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {searchLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Search size={18} />
                      )}
                    </button>
                  </div>

                  {searchResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-800 mb-2">Jeune trouvé</h5>
                          <div className="text-sm text-green-700 space-y-1">
                            <p><strong>Matricule:</strong> {MatriculeService.formatMatricule(searchResult.matricule)}</p>
                            <p><strong>Nom:</strong> {searchResult.nom_prenom || searchResult.nomPrenom}</p>
                            <p><strong>Groupe:</strong> {searchResult.groupe_assigne || searchResult.groupeAssigne}</p>
                            <p><strong>Affectation:</strong> {searchResult.date_affectation ? new Date(searchResult.date_affectation).toLocaleDateString('fr-FR') : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchMatricule && !searchLoading && !searchResult && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-red-800 mb-2">Matricule non trouvé</h5>
                          <p className="text-sm text-red-700">
                            Aucun jeune trouvé avec le matricule "{searchMatricule}".
                            Vérifiez le format (ex: 25A3) et réessayez.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={exportMatriculeReport}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Exporter Rapport
            </button>
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

export default MatriculeManager;