import React, { useState } from 'react';
import { YouthData } from '../types';
import { GroupAssignmentService } from '../utils/groupAssignment';
import { User, Heart, Briefcase, GraduationCap, Church, MessageCircle, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import QRCodeScanner from './QRCodeScanner';

const YouthRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<YouthData>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; group?: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showQRScanner, setShowQRScanner] = useState(false);

  const sections = [
    { title: 'Informations Personnelles', icon: User },
    { title: 'Statut Matrimonial', icon: Heart },
    { title: 'Situation Professionnelle', icon: Briefcase },
    { title: 'Niveau d\'Études', icon: GraduationCap },
    { title: 'Situation Spirituelle', icon: Church },
    { title: 'Votre Avis', icon: MessageCircle }
  ];

  const validateCurrentSection = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (currentSection) {
      case 0: // Informations Personnelles
        if (!formData.nomPrenom?.trim()) newErrors.nomPrenom = 'Nom et prénom requis';
        if (!formData.genre) newErrors.genre = 'Genre requis';
        if (!formData.trancheAge) newErrors.trancheAge = 'Tranche d\'âge requise';
        if (!formData.quartierResidence?.trim()) newErrors.quartierResidence = 'Quartier de résidence requis';
        if (!formData.contact1?.trim()) newErrors.contact1 = 'Contact 1 requis';
        break;
      case 1: // Statut Matrimonial
        if (!formData.statutMatrimonial) newErrors.statutMatrimonial = 'Statut matrimonial requis';
        break;
      case 2: // Situation Professionnelle
        if (!formData.situationProfessionnelle) newErrors.situationProfessionnelle = 'Situation professionnelle requise';
        if (formData.situationProfessionnelle === 'Travailleur' && !formData.typeTravail) {
          newErrors.typeTravail = 'Type de travail requis';
        }
        break;
      case 3: // Niveau d'Études
        if (!formData.niveauEtude) newErrors.niveauEtude = 'Niveau d\'étude requis';
        break;
      case 4: // Situation Spirituelle
        if (!formData.anneeConversion) newErrors.anneeConversion = 'Année de conversion requise';
        if (!formData.baptemeEau) newErrors.baptemeEau = 'Information baptême d\'eau requise';
        if (!formData.baptemeSaintEsprit) newErrors.baptemeSaintEsprit = 'Information baptême Saint-Esprit requise';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = () => {
    handleSubmitAsync();
  };

  const handleSubmitAsync = async () => {
    try {
      const result = await GroupAssignmentService.registerYouth(formData as YouthData);
      setResult(result);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setResult({
        success: false,
        message: "Erreur lors de l'inscription. Veuillez réessayer."
      });
    }
  };

  const handleInputChange = (field: keyof YouthData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {result.success ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Félicitations !</h2>
              <p className="text-gray-600 mb-4">{result.message}</p>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                <p className="text-lg font-semibold">Votre groupe :</p>
                <p className="text-xl font-bold">{result.group}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Inscription impossible</h2>
              <p className="text-gray-600 mb-4">{result.message}</p>
              <button
                onClick={() => setResult(null)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom et Prénom *
              </label>
              <input
                type="text"
                value={formData.nomPrenom || ''}
                onChange={(e) => handleInputChange('nomPrenom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nomPrenom ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre nom et prénom complets"
              />
              {errors.nomPrenom && <p className="text-red-500 text-xs mt-1">{errors.nomPrenom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
              <div className="flex gap-4">
                {['Homme', 'Femme'].map((genre) => (
                  <label key={genre} className="flex items-center">
                    <input
                      type="radio"
                      value={genre}
                      checked={formData.genre === genre}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      className="mr-2"
                    />
                    {genre}
                  </label>
                ))}
              </div>
              {errors.genre && <p className="text-red-500 text-xs mt-1">{errors.genre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tranche d'âge *</label>
              <select
                value={formData.trancheAge || ''}
                onChange={(e) => handleInputChange('trancheAge', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.trancheAge ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner...</option>
                <option value="13-17">13-17 ans</option>
                <option value="18-24">18-24 ans</option>
                <option value="25-30">25-30 ans</option>
                <option value="31-40">31-40 ans</option>
                <option value="41+">41+ ans</option>
              </select>
              {errors.trancheAge && <p className="text-red-500 text-xs mt-1">{errors.trancheAge}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo (optionnel)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleInputChange('photo', e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Formats acceptés : JPG, PNG, GIF (max 5MB)</p>
              {formData.photo && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Photo sélectionnée : {formData.photo.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quartier de résidence *
              </label>
              <input
                type="text"
                value={formData.quartierResidence || ''}
                onChange={(e) => handleInputChange('quartierResidence', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quartierResidence ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre quartier"
              />
              {errors.quartierResidence && <p className="text-red-500 text-xs mt-1">{errors.quartierResidence}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact 1 *</label>
                <input
                  type="tel"
                  value={formData.contact1 || ''}
                  onChange={(e) => handleInputChange('contact1', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contact1 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Numéro principal"
                />
                {errors.contact1 && <p className="text-red-500 text-xs mt-1">{errors.contact1}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact 2</label>
                <input
                  type="tel"
                  value={formData.contact2 || ''}
                  onChange={(e) => handleInputChange('contact2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Numéro secondaire"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Statut matrimonial *</label>
              <div className="space-y-2">
                {['Marié(e)', 'Célibataire', 'Veuf(ve)', 'Fiancé(e)', 'Concubinage'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="radio"
                      value={status}
                      checked={formData.statutMatrimonial === status}
                      onChange={(e) => handleInputChange('statutMatrimonial', e.target.value)}
                      className="mr-3"
                    />
                    {status}
                  </label>
                ))}
              </div>
              {errors.statutMatrimonial && <p className="text-red-500 text-xs mt-1">{errors.statutMatrimonial}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Situation professionnelle *</label>
              <div className="space-y-2">
                {[
                  { value: 'Étudiant(e)', label: 'Étudiant(e)' },
                  { value: 'Travailleur', label: 'Travailleur' },
                  { value: 'Sans emploi', label: 'Sans emploi' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      value={option.value}
                      checked={formData.situationProfessionnelle === option.value}
                      onChange={(e) => handleInputChange('situationProfessionnelle', e.target.value)}
                      className="mr-3"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.situationProfessionnelle && <p className="text-red-500 text-xs mt-1">{errors.situationProfessionnelle}</p>}
            </div>

            {formData.situationProfessionnelle === 'Travailleur' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de travail *</label>
                <select
                  value={formData.typeTravail || ''}
                  onChange={(e) => handleInputChange('typeTravail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.typeTravail ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner...</option>
                  <option value="Public">Public</option>
                  <option value="Privé">Privé</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                  <option value="Je vais au cours">Je vais au cours</option>
                </select>
                {errors.typeTravail && <p className="text-red-500 text-xs mt-1">{errors.typeTravail}</p>}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'étude *</label>
              <select
                value={formData.niveauEtude || ''}
                onChange={(e) => handleInputChange('niveauEtude', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.niveauEtude ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner...</option>
                <option value="Aucun">Aucun</option>
                <option value="Primaire">Primaire</option>
                <option value="Secondaire">Secondaire</option>
                <option value="Formation qualifiante">Formation qualifiante</option>
                <option value="Bac">Bac</option>
                <option value="BTS">BTS</option>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
                <option value="Formation professionnelle">Formation professionnelle</option>
                <option value="DUT">DUT</option>
              </select>
              {errors.niveauEtude && <p className="text-red-500 text-xs mt-1">{errors.niveauEtude}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année de conversion *</label>
              <select
                value={formData.anneeConversion || ''}
                onChange={(e) => handleInputChange('anneeConversion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.anneeConversion ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner...</option>
                <option value="0-3">0-3 ans</option>
                <option value="4-7">4-7 ans</option>
                <option value="7-10">7-10 ans</option>
                <option value="10-20">10-20 ans</option>
                <option value="20-40">20-40 ans</option>
                <option value="40+">40+ ans</option>
              </select>
              {errors.anneeConversion && <p className="text-red-500 text-xs mt-1">{errors.anneeConversion}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Baptême d'eau *</label>
                <div className="space-y-2">
                  {['OUI', 'NON'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        value={option}
                        checked={formData.baptemeEau === option}
                        onChange={(e) => handleInputChange('baptemeEau', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.baptemeEau && <p className="text-red-500 text-xs mt-1">{errors.baptemeEau}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Baptême Saint-Esprit *</label>
                <div className="space-y-2">
                  {['OUI', 'NON'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        value={option}
                        checked={formData.baptemeSaintEsprit === option}
                        onChange={(e) => handleInputChange('baptemeSaintEsprit', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.baptemeSaintEsprit && <p className="text-red-500 text-xs mt-1">{errors.baptemeSaintEsprit}</p>}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dites quelque chose au bureau de jeunesse
              </label>
              <textarea
                value={formData.messageJeunesse || ''}
                onChange={(e) => handleInputChange('messageJeunesse', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre message, suggestions, ou questions..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mr-4">GestJADYG - Inscription</h1>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-lg"
              title="Scanner un QR code pour confirmer votre présence"
            >
              <QrCode size={20} className="mr-2" />
              Scanner QR
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Ce formulaire vous permet de vous inscrire et d'être automatiquement affecté à un groupe de jeunesse.
          </p>
          <p className="text-sm text-gray-500">
            Nous avons 10 Groupes de Jeunesses : "Disciples", "Les Élus", "Sel et Lumière", "Porteurs de l'Alliance",
            "Bergerie du Maître", "Vases d'Honneur", "Sacerdoce Royal", "Flambeaux", "Serviteurs Fidèles", "Héritiers du Royaume"
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center ${
                    index <= currentSection ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= currentSection ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  {index < sections.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ml-2 ${
                        index < currentSection ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-gray-600">
              {sections[currentSection].title}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              {React.createElement(sections[currentSection].icon, { className: "mr-2 text-blue-600" })}
              {sections[currentSection].title}
            </h2>
            {renderSection()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentSection === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentSection === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              } transition-colors`}
            >
              Précédent
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {currentSection === sections.length - 1 ? 'Valider' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner onClose={() => setShowQRScanner(false)} />
      )}
    </div>
  );
};

export default YouthRegistrationForm;