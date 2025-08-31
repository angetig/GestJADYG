import React, { useState, useEffect } from 'react';
import { SocialCase, SocialCaseType, YouthData, YOUTH_GROUPS } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { Heart, Users, Baby, Plus, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface SocialCasesManagerProps {
  onClose: () => void;
}

const SocialCasesManager: React.FC<SocialCasesManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'reports'>('list');
  const [caseType, setCaseType] = useState<SocialCaseType>('marriage');
  const [socialCases, setSocialCases] = useState<SocialCase[]>([]);
  const [youthMembers, setYouthMembers] = useState<YouthData[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current user role and group
  const currentUser = JSON.parse(localStorage.getItem('youth_auth') || '{}');
  const isAdmin = currentUser.role === 'admin';
  const userGroup = currentUser.groupName;

  // Form states
  const [marriageForm, setMarriageForm] = useState({
    husbandName: '',
    husbandGroup: '',
    husbandIsMember: true, // New field to track if person is church member
    wifeName: '',
    wifeGroup: '',
    wifeIsMember: true, // New field to track if person is church member
    marriageDate: '',
    description: ''
  });

  const [deathForm, setDeathForm] = useState({
    deceasedName: '',
    relationship: 'father' as SocialCase['relationship'],
    affectedYouth: [{ name: '', group: '' }],
    deathDate: '',
    description: ''
  });

  const [birthForm, setBirthForm] = useState({
    fatherName: '',
    fatherGroup: '',
    fatherIsMember: true, // New field to track if father is church member
    motherName: '',
    motherGroup: '',
    motherIsMember: true, // New field to track if mother is church member
    newbornName: '',
    birthDate: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load youth members for validation
      const members = await GroupAssignmentService.getStoredData();
      setYouthMembers(members);

      // Load existing social cases from localStorage
      const savedCases = localStorage.getItem('gestjadyg_social_cases');
      if (savedCases) {
        setSocialCases(JSON.parse(savedCases));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForDuplicates = (newCase: Partial<SocialCase>): SocialCase | null => {
    return socialCases.find(existingCase => {
      if (existingCase.type !== newCase.type) return false;

      switch (newCase.type) {
        case 'marriage':
          return (
            existingCase.husbandName === newCase.husbandName &&
            existingCase.wifeName === newCase.wifeName &&
            Math.abs(new Date(existingCase.marriageDate!).getTime() - new Date(newCase.marriageDate!).getTime()) < 86400000 // Within 24 hours
          );
        case 'death':
          return (
            existingCase.deceasedName === newCase.deceasedName &&
            existingCase.relationship === newCase.relationship &&
            Math.abs(new Date(existingCase.deathDate!).getTime() - new Date(newCase.deathDate!).getTime()) < 86400000
          );
        case 'birth':
          return (
            existingCase.newbornName === newCase.newbornName &&
            existingCase.fatherName === newCase.fatherName &&
            existingCase.motherName === newCase.motherName &&
            existingCase.birthDate && newCase.birthDate &&
            Math.abs(new Date(existingCase.birthDate).getTime() - new Date(newCase.birthDate).getTime()) < 86400000
          );
        default:
          return false;
      }
    }) || null;
  };

  const handleSubmitMarriage = () => {
    const newCase: SocialCase = {
      id: Date.now().toString(),
      type: 'marriage',
      reportedBy: 'Admin', // Since this is from admin dashboard
      reportedAt: new Date().toISOString(),
      status: 'pending',
      husbandName: marriageForm.husbandName,
      husbandGroup: marriageForm.husbandIsMember ? marriageForm.husbandGroup : marriageForm.husbandGroup || 'extérieur',
      wifeName: marriageForm.wifeName,
      wifeGroup: marriageForm.wifeIsMember ? marriageForm.wifeGroup : marriageForm.wifeGroup || 'extérieur',
      marriageDate: marriageForm.marriageDate,
      description: marriageForm.description,
      linkedYouthIds: []
    };

    // Check for duplicates
    const duplicate = checkForDuplicates(newCase);
    if (duplicate) {
      newCase.duplicateOf = duplicate.id;
      newCase.status = 'duplicate';
    }

    const updatedCases = [...socialCases, newCase];
    setSocialCases(updatedCases);
    localStorage.setItem('gestjadyg_social_cases', JSON.stringify(updatedCases));

    // Reset form
    setMarriageForm({
      husbandName: '',
      husbandGroup: '',
      husbandIsMember: true,
      wifeName: '',
      wifeGroup: '',
      wifeIsMember: true,
      marriageDate: '',
      description: ''
    });
  };

  const handleSubmitDeath = () => {
    const newCase: SocialCase = {
      id: Date.now().toString(),
      type: 'death',
      reportedBy: 'Admin',
      reportedAt: new Date().toISOString(),
      status: 'pending',
      deceasedName: deathForm.deceasedName,
      relationship: deathForm.relationship,
      affectedYouth: deathForm.affectedYouth.filter(y => y.name && y.group),
      deathDate: deathForm.deathDate,
      description: deathForm.description,
      linkedYouthIds: []
    };

    // Check for duplicates
    const duplicate = checkForDuplicates(newCase);
    if (duplicate) {
      newCase.duplicateOf = duplicate.id;
      newCase.status = 'duplicate';
    }

    const updatedCases = [...socialCases, newCase];
    setSocialCases(updatedCases);
    localStorage.setItem('gestjadyg_social_cases', JSON.stringify(updatedCases));

    // Reset form
    setDeathForm({
      deceasedName: '',
      relationship: 'father',
      affectedYouth: [{ name: '', group: '' }],
      deathDate: '',
      description: ''
    });
  };

  const handleSubmitBirth = () => {
    const newCase: SocialCase = {
      id: Date.now().toString(),
      type: 'birth',
      reportedBy: 'Admin',
      reportedAt: new Date().toISOString(),
      status: 'pending',
      fatherName: birthForm.fatherName,
      fatherGroup: birthForm.fatherIsMember ? birthForm.fatherGroup : birthForm.fatherGroup || 'extérieur',
      motherName: birthForm.motherName,
      motherGroup: birthForm.motherIsMember ? birthForm.motherGroup : birthForm.motherGroup || 'extérieur',
      newbornName: birthForm.newbornName,
      birthDate: birthForm.birthDate,
      description: birthForm.description,
      linkedYouthIds: []
    };

    // Check for duplicates
    const duplicate = checkForDuplicates(newCase);
    if (duplicate) {
      newCase.duplicateOf = duplicate.id;
      newCase.status = 'duplicate';
    }

    const updatedCases = [...socialCases, newCase];
    setSocialCases(updatedCases);
    localStorage.setItem('gestjadyg_social_cases', JSON.stringify(updatedCases));

    // Reset form
    setBirthForm({
      fatherName: '',
      fatherGroup: '',
      fatherIsMember: true,
      motherName: '',
      motherGroup: '',
      motherIsMember: true,
      newbornName: '',
      birthDate: '',
      description: ''
    });
  };

  const addAffectedYouth = () => {
    setDeathForm(prev => ({
      ...prev,
      affectedYouth: [...prev.affectedYouth, { name: '', group: '' }]
    }));
  };

  const updateAffectedYouth = (index: number, field: 'name' | 'group', value: string) => {
    setDeathForm(prev => ({
      ...prev,
      affectedYouth: prev.affectedYouth.map((youth, i) =>
        i === index ? { ...youth, [field]: value } : youth
      )
    }));
  };

  const removeAffectedYouth = (index: number) => {
    setDeathForm(prev => ({
      ...prev,
      affectedYouth: prev.affectedYouth.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = (status: SocialCase['status']) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: SocialCase['status']) => {
    switch (status) {
      case 'validated':
        return 'Validé';
      case 'duplicate':
        return 'Doublon';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'En attente';
    }
  };

  // Filter cases based on user role
  const getFilteredCases = () => {
    if (isAdmin) {
      return socialCases; // Admin sees all cases
    } else {
      // Group leaders see only cases from their group or cases that affect their group members
      return socialCases.filter(socialCase => {
        // Cases reported by their group
        if (socialCase.reportedBy === userGroup) return true;

        // Cases that affect members of their group (for deaths)
        if (socialCase.type === 'death' && socialCase.affectedYouth) {
          return socialCase.affectedYouth.some(youth => youth.group === userGroup);
        }

        // Cases involving members of their group (for marriages and births)
        if (socialCase.type === 'marriage') {
          return socialCase.husbandGroup === userGroup || socialCase.wifeGroup === userGroup;
        }

        if (socialCase.type === 'birth') {
          return socialCase.fatherGroup === userGroup || socialCase.motherGroup === userGroup;
        }

        return false;
      });
    }
  };

  // Generate consolidated reports for admins
  const generateReports = () => {
    const totalCases = socialCases.length;
    const validatedCases = socialCases.filter(c => c.status === 'validated').length;
    const pendingCases = socialCases.filter(c => c.status === 'pending').length;
    const rejectedCases = socialCases.filter(c => c.status === 'rejected').length;
    const duplicateCases = socialCases.filter(c => c.status === 'duplicate').length;

    const casesByType = {
      marriage: socialCases.filter(c => c.type === 'marriage').length,
      death: socialCases.filter(c => c.type === 'death').length,
      birth: socialCases.filter(c => c.type === 'birth').length
    };

    const casesByGroup = YOUTH_GROUPS.reduce((acc, group) => {
      acc[group] = socialCases.filter(c => c.reportedBy === group).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCases,
      validatedCases,
      pendingCases,
      rejectedCases,
      duplicateCases,
      casesByType,
      casesByGroup
    };
  };

  const handleValidateCase = (caseId: string) => {
    const updatedCases = socialCases.map(caseItem =>
      caseItem.id === caseId
        ? {
            ...caseItem,
            status: 'validated' as const,
            validatedBy: 'Admin',
            validatedAt: new Date().toISOString()
          }
        : caseItem
    );
    setSocialCases(updatedCases);
    localStorage.setItem('gestjadyg_social_cases', JSON.stringify(updatedCases));
  };

  const handleRejectCase = (caseId: string, reason: string) => {
    const updatedCases = socialCases.map(caseItem =>
      caseItem.id === caseId
        ? {
            ...caseItem,
            status: 'rejected' as const,
            validatedBy: 'Admin',
            validatedAt: new Date().toISOString(),
            rejectionReason: reason
          }
        : caseItem
    );
    setSocialCases(updatedCases);
    localStorage.setItem('gestjadyg_social_cases', JSON.stringify(updatedCases));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des cas sociaux...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              Gestion des Cas Sociaux
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
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Liste des Cas
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Déclarer un Cas
            </button>
            {isAdmin && (
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
            )}
          </div>

          {activeTab === 'list' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Cas Sociaux Déclarés</h4>

              {getFilteredCases().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredCases().map((socialCase) => (
                    <div key={socialCase.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                              socialCase.type === 'marriage' ? 'bg-pink-100 text-pink-800' :
                              socialCase.type === 'death' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {socialCase.type === 'marriage' && <Heart className="w-3 h-3 mr-1" />}
                              {socialCase.type === 'death' && <Users className="w-3 h-3 mr-1" />}
                              {socialCase.type === 'birth' && <Baby className="w-3 h-3 mr-1" />}
                              {socialCase.type === 'marriage' ? 'Mariage' :
                               socialCase.type === 'death' ? 'Décès' : 'Naissance'}
                            </span>
                            <span className="text-sm text-gray-500">
                              Déclaré par {socialCase.reportedBy} le {new Date(socialCase.reportedAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          <div className="text-sm text-gray-700 space-y-1">
                            {socialCase.type === 'marriage' && (
                              <>
                                <p><strong>Mariage:</strong> {socialCase.husbandName} ({socialCase.husbandGroup || 'extérieur'}) & {socialCase.wifeName} ({socialCase.wifeGroup || 'extérieur'})</p>
                                <p><strong>Date:</strong> {new Date(socialCase.marriageDate!).toLocaleDateString('fr-FR')}</p>
                              </>
                            )}
                            {socialCase.type === 'death' && (
                              <>
                                <p><strong>Décès:</strong> {socialCase.deceasedName} ({socialCase.relationship})</p>
                                <p><strong>Jeunes concernés:</strong> {socialCase.affectedYouth?.map(y => `${y.name} (${y.group})`).join(', ') || 'Aucun'}</p>
                              </>
                            )}
                            {socialCase.type === 'birth' && (
                              <>
                                <p><strong>Naissance:</strong> {socialCase.newbornName}</p>
                                <p><strong>Parents:</strong> {socialCase.fatherName} ({socialCase.fatherGroup || 'extérieur'}) & {socialCase.motherName} ({socialCase.motherGroup || 'extérieur'})</p>
                                <p><strong>Date:</strong> {socialCase.birthDate ? new Date(socialCase.birthDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
                              </>
                            )}

                            {/* Afficher les informations de validation */}
                            {socialCase.validatedBy && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <p><strong>Validé par:</strong> {socialCase.validatedBy}</p>
                                <p><strong>Date:</strong> {new Date(socialCase.validatedAt!).toLocaleDateString('fr-FR')}</p>
                                {socialCase.rejectionReason && (
                                  <p><strong>Raison du rejet:</strong> {socialCase.rejectionReason}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center ml-4 space-x-2">
                          {getStatusIcon(socialCase.status)}
                          <span className="ml-1 text-sm text-gray-600">{getStatusText(socialCase.status)}</span>

                          {/* Boutons de validation pour les administrateurs */}
                          {socialCase.status === 'pending' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleValidateCase(socialCase.id)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                title="Valider le cas"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Raison du rejet:');
                                  if (reason) handleRejectCase(socialCase.id, reason);
                                }}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                title="Rejeter le cas"
                              >
                                ✗
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isAdmin ? 'Aucun cas social déclaré' : 'Aucun cas social pour votre groupe'}
                  </h3>
                  <p className="text-gray-600">
                    {isAdmin ? 'Commencez par déclarer un cas social' : 'Les cas sociaux de votre groupe apparaîtront ici'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Déclarer un Nouveau Cas Social</h4>

              {/* Case Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCaseType('marriage')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    caseType === 'marriage'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                  <h3 className="font-semibold">Mariage</h3>
                  <p className="text-sm">Union conjugale</p>
                </button>

                <button
                  onClick={() => setCaseType('death')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    caseType === 'death'
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <h3 className="font-semibold">Décès</h3>
                  <p className="text-sm">Perte d'un proche</p>
                </button>

                <button
                  onClick={() => setCaseType('birth')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    caseType === 'birth'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Baby className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-semibold">Naissance</h3>
                  <p className="text-sm">Arrivée d'un enfant</p>
                </button>
              </div>

              {/* Marriage Form */}
              {caseType === 'marriage' && (
                <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
                  <h5 className="text-lg font-semibold text-pink-800 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Déclaration de Mariage
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du mari *</label>
                      <input
                        type="text"
                        value={marriageForm.husbandName}
                        onChange={(e) => setMarriageForm(prev => ({ ...prev, husbandName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Nom et prénom"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={marriageForm.husbandIsMember}
                          onChange={(e) => setMarriageForm(prev => ({
                            ...prev,
                            husbandIsMember: e.target.checked,
                            husbandGroup: e.target.checked ? prev.husbandGroup : ''
                          }))}
                          className="mr-2"
                        />
                        Membre de l'église
                      </label>
                      {marriageForm.husbandIsMember && (
                        <select
                          value={marriageForm.husbandGroup}
                          onChange={(e) => setMarriageForm(prev => ({ ...prev, husbandGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un groupe</option>
                          {YOUTH_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      )}
                      {!marriageForm.husbandIsMember && (
                        <input
                          type="text"
                          value={marriageForm.husbandGroup}
                          onChange={(e) => setMarriageForm(prev => ({ ...prev, husbandGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Église d'origine (optionnel)"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la femme *</label>
                      <input
                        type="text"
                        value={marriageForm.wifeName}
                        onChange={(e) => setMarriageForm(prev => ({ ...prev, wifeName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Nom et prénom"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={marriageForm.wifeIsMember}
                          onChange={(e) => setMarriageForm(prev => ({
                            ...prev,
                            wifeIsMember: e.target.checked,
                            wifeGroup: e.target.checked ? prev.wifeGroup : ''
                          }))}
                          className="mr-2"
                        />
                        Membre de l'église
                      </label>
                      {marriageForm.wifeIsMember && (
                        <select
                          value={marriageForm.wifeGroup}
                          onChange={(e) => setMarriageForm(prev => ({ ...prev, wifeGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un groupe</option>
                          {YOUTH_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      )}
                      {!marriageForm.wifeIsMember && (
                        <input
                          type="text"
                          value={marriageForm.wifeGroup}
                          onChange={(e) => setMarriageForm(prev => ({ ...prev, wifeGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Église d'origine (optionnel)"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date du mariage *</label>
                      <input
                        type="date"
                        value={marriageForm.marriageDate}
                        onChange={(e) => setMarriageForm(prev => ({ ...prev, marriageDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                    <textarea
                      value={marriageForm.description}
                      onChange={(e) => setMarriageForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSubmitMarriage}
                      disabled={
                        !marriageForm.husbandName ||
                        !marriageForm.wifeName ||
                        !marriageForm.marriageDate ||
                        (marriageForm.husbandIsMember && !marriageForm.husbandGroup) ||
                        (marriageForm.wifeIsMember && !marriageForm.wifeGroup)
                      }
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Déclarer le Mariage
                    </button>
                  </div>
                </div>
              )}

              {/* Death Form */}
              {caseType === 'death' && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Déclaration de Décès
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du défunt *</label>
                      <input
                        type="text"
                        value={deathForm.deceasedName}
                        onChange={(e) => setDeathForm(prev => ({ ...prev, deceasedName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="Nom et prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lien de parenté *</label>
                      <select
                        value={deathForm.relationship}
                        onChange={(e) => setDeathForm(prev => ({ ...prev, relationship: e.target.value as SocialCase['relationship'] }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      >
                        <option value="father">Père</option>
                        <option value="mother">Mère</option>
                        <option value="brother">Frère</option>
                        <option value="sister">Sœur</option>
                        <option value="child">Enfant</option>
                        <option value="grandparent">Grand-parent</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date du décès *</label>
                      <input
                        type="date"
                        value={deathForm.deathDate}
                        onChange={(e) => setDeathForm(prev => ({ ...prev, deathDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jeunes concernés *</label>
                    {deathForm.affectedYouth.map((youth, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={youth.name}
                          onChange={(e) => updateAffectedYouth(index, 'name', e.target.value)}
                          placeholder="Nom du jeune"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        />
                        <select
                          value={youth.group}
                          onChange={(e) => updateAffectedYouth(index, 'group', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        >
                          <option value="">Groupe</option>
                          {YOUTH_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                        {deathForm.affectedYouth.length > 1 && (
                          <button
                            onClick={() => removeAffectedYouth(index)}
                            className="text-red-600 hover:text-red-800 p-2"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addAffectedYouth}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Ajouter un jeune
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                    <textarea
                      value={deathForm.description}
                      onChange={(e) => setDeathForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSubmitDeath}
                      disabled={!deathForm.deceasedName || !deathForm.relationship || !deathForm.affectedYouth.some(y => y.name && y.group)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Déclarer le Décès
                    </button>
                  </div>
                </div>
              )}

              {/* Birth Form */}
              {caseType === 'birth' && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h5 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <Baby className="w-5 h-5 mr-2" />
                    Déclaration de Naissance
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du père *</label>
                      <input
                        type="text"
                        value={birthForm.fatherName}
                        onChange={(e) => setBirthForm(prev => ({ ...prev, fatherName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nom et prénom du père"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={birthForm.fatherIsMember}
                          onChange={(e) => setBirthForm(prev => ({
                            ...prev,
                            fatherIsMember: e.target.checked,
                            fatherGroup: e.target.checked ? prev.fatherGroup : ''
                          }))}
                          className="mr-2"
                        />
                        Père membre de l'église
                      </label>
                      {birthForm.fatherIsMember && (
                        <select
                          value={birthForm.fatherGroup}
                          onChange={(e) => setBirthForm(prev => ({ ...prev, fatherGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un groupe</option>
                          {YOUTH_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      )}
                      {!birthForm.fatherIsMember && (
                        <input
                          type="text"
                          value={birthForm.fatherGroup}
                          onChange={(e) => setBirthForm(prev => ({ ...prev, fatherGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Église d'origine (optionnel)"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la mère *</label>
                      <input
                        type="text"
                        value={birthForm.motherName}
                        onChange={(e) => setBirthForm(prev => ({ ...prev, motherName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nom et prénom de la mère"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={birthForm.motherIsMember}
                          onChange={(e) => setBirthForm(prev => ({
                            ...prev,
                            motherIsMember: e.target.checked,
                            motherGroup: e.target.checked ? prev.motherGroup : ''
                          }))}
                          className="mr-2"
                        />
                        Mère membre de l'église
                      </label>
                      {birthForm.motherIsMember && (
                        <select
                          value={birthForm.motherGroup}
                          onChange={(e) => setBirthForm(prev => ({ ...prev, motherGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner un groupe</option>
                          {YOUTH_GROUPS.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      )}
                      {!birthForm.motherIsMember && (
                        <input
                          type="text"
                          value={birthForm.motherGroup}
                          onChange={(e) => setBirthForm(prev => ({ ...prev, motherGroup: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Église d'origine (optionnel)"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du nouveau-né *</label>
                      <input
                        type="text"
                        value={birthForm.newbornName}
                        onChange={(e) => setBirthForm(prev => ({ ...prev, newbornName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nom et prénom"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                      <input
                        type="date"
                        value={birthForm.birthDate}
                        onChange={(e) => setBirthForm(prev => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                    <textarea
                      value={birthForm.description}
                      onChange={(e) => setBirthForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSubmitBirth}
                      disabled={
                        !birthForm.fatherName ||
                        !birthForm.motherName ||
                        !birthForm.newbornName ||
                        !birthForm.birthDate ||
                        (birthForm.fatherIsMember && !birthForm.fatherGroup) ||
                        (birthForm.motherIsMember && !birthForm.motherGroup)
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Déclarer la Naissance
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab - Admin Only */}
          {activeTab === 'reports' && isAdmin && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Rapports Consolidés</h4>

              {(() => {
                const reports = generateReports();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* General Statistics */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">Statistiques Générales</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total des cas:</span>
                          <span className="font-semibold">{reports.totalCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Validés:</span>
                          <span className="font-semibold text-green-600">{reports.validatedCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-600">En attente:</span>
                          <span className="font-semibold text-yellow-600">{reports.pendingCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Rejetés:</span>
                          <span className="font-semibold text-red-600">{reports.rejectedCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-600">Doublons:</span>
                          <span className="font-semibold text-orange-600">{reports.duplicateCases}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cases by Type */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">Par Type</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-pink-600">Mariages:</span>
                          <span className="font-semibold">{reports.casesByType.marriage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Décès:</span>
                          <span className="font-semibold">{reports.casesByType.death}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">Naissances:</span>
                          <span className="font-semibold">{reports.casesByType.birth}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cases by Group */}
                    <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-1">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">Par Groupe</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {Object.entries(reports.casesByGroup).map(([group, count]) => (
                          <div key={group} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate">{group}:</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
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

export default SocialCasesManager;