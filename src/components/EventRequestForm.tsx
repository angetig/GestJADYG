import React, { useState } from 'react';
import { EventRequest } from '../types/event';
import { Calendar, Clock, MapPin, Target, DollarSign, FileText, Save, Send, ArrowLeft } from 'lucide-react';
import { notificationService } from '../utils/notificationService';

interface Props {
  onSubmit: (event: EventRequest) => void;
  groupName: string;
}

const initialState: EventRequest = {
  title: '',
  date: '',
  time: '',
  location: '',
  objectives: '',
  budget: undefined,
  description: '',
  status: 'draft',
  groupName: '',
  submittedAt: '',
};

const EventRequestForm: React.FC<Props> = ({ onSubmit, groupName }) => {
  const [form, setForm] = useState<EventRequest>({ ...initialState, groupName });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'pending') => {
    e.preventDefault();
    const now = new Date().toISOString();
    const eventData = { ...form, submittedAt: now, status };

    // Create notification when event is submitted for validation
    if (status === 'pending') {
      notificationService.notifyEventSubmitted(eventData);
    }

    onSubmit(eventData);
    if (status === 'pending') {
      setForm({ ...initialState, groupName });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logos */}
        <div className="mb-8">
          <div className="flex justify-center items-center mb-6">
            <img src="/logo-left.png" alt="Logo gauche" className="h-16 w-auto mr-4" />
            <img src="/logo-right.png" alt="Logo droite" className="h-16 w-auto ml-4" />
          </div>

          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un Événement</h1>
            <p className="text-gray-600">Soumettez votre demande d'événement pour validation</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Informations</span>
            </div>
            <div className="w-16 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Validation</span>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Détails de l'Événement</h2>
            <p className="text-blue-100 mt-1">Remplissez tous les champs requis</p>
          </div>

          <form className="p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                Informations de base
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'événement *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Ex: Réunion de prière mensuelle"
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    Heure *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    Lieu *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Ex: Salle paroissiale, Centre communautaire"
                  />
                </div>
              </div>
            </div>

            {/* Objectives Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                Objectifs
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectifs de l'événement *
                </label>
                <textarea
                  name="objectives"
                  value={form.objectives}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Décrivez les objectifs principaux de cet événement..."
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
                Budget (Optionnel)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget estimé (FCFA)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Ex: 50000"
                />
                <p className="text-sm text-gray-500 mt-1">Laissez vide si le budget n'est pas encore déterminé</p>
              </div>
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                Description détaillée
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description complète *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Fournissez une description détaillée de l'événement, incluant le programme prévu, les participants ciblés, etc."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5 mr-2" />
                Enregistrer comme brouillon
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'pending')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-lg hover:shadow-xl"
              >
                <Send className="w-5 h-5 mr-2" />
                Soumettre pour validation
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Les champs marqués d'un * sont obligatoires</p>
          <p className="mt-1">Votre demande sera examinée par l'administrateur</p>
        </div>
      </div>
    </div>
  );
};

export default EventRequestForm;
