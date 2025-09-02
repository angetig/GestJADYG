import React, { useState, useEffect } from 'react';
import { QRCode, EventRequest } from '../types';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { EventService } from '../utils/eventService';
import { QrCode, Clock, Users, Calendar, Plus, Eye, Trash2, AlertTriangle } from 'lucide-react';

interface QRCodeManagerProps {
  onClose: () => void;
}

const QRCodeManager: React.FC<QRCodeManagerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<QRCode | null>(null);

  useEffect(() => {
    loadQRCodes();
    loadApprovedEvents();
  }, []);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const codes = await QRAttendanceService.getActiveQRCodes();
      setQrCodes(codes);
    } catch (error) {
      console.error('Erreur lors du chargement des QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedEvents = async () => {
    setEventsLoading(true);
    try {
      const events = await EventService.getApprovedEvents();
      setApprovedEvents(events);
    } catch (error) {
      console.error('Erreur lors du chargement des événements approuvés:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleGenerateQR = async (event: EventRequest) => {
    try {
      // Get current user info
      const currentUserData = localStorage.getItem('youth_auth');
      const currentUser = currentUserData ? JSON.parse(currentUserData) : {};

      const qrCode = await QRAttendanceService.generateQRCode({
        eventId: event.id || 'unknown',
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        groupName: event.groupName,
        createdBy: currentUser.name || 'Admin'
      });

      if (qrCode) {
        setGeneratedQR(qrCode);
        setShowQRModal(true);
        await loadQRCodes(); // Refresh the list
        alert('QR code généré avec succès !');
      } else {
        alert('Erreur lors de la génération du QR code');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      alert('Erreur lors de la génération du QR code');
    }
  };

  const handleDeactivateQR = async (qrCodeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir désactiver ce QR code ?')) {
      try {
        const success = await QRAttendanceService.deactivateQRCode(qrCodeId);
        if (success) {
          await loadQRCodes();
          alert('QR code désactivé avec succès');
        } else {
          alert('Erreur lors de la désactivation du QR code');
        }
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
        alert('Erreur lors de la désactivation du QR code');
      }
    }
  };

  const QRCodeDisplay: React.FC<{ qrCode: QRCode }> = ({ qrCode }) => {
    // For now, we'll use a placeholder. In a real implementation,
    // you'd use a QR code library like 'react-qr-code' or 'qrcode'
    return (
      <div className="text-center">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-300 inline-block">
          <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
            <QrCode size={64} className="text-gray-400" />
            <div className="absolute text-xs text-gray-500 mt-16">
              QR Code Placeholder
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>ID:</strong> {qrCode.id.slice(0, 8)}...</p>
          <p><strong>Expire le:</strong> {new Date(qrCode.expiresAt).toLocaleString('fr-FR')}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des QR codes...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-blue-600" />
              Gestion des QR Codes de Pointage
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
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Générer QR Code
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Gérer QR Codes ({qrCodes.length})
            </button>
          </div>

          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Génération de QR Code</h4>
                <p className="text-blue-700 text-sm">
                  Sélectionnez un événement pour générer un QR code de pointage valable 24h.
                  Ce QR code sera visible et utilisable par <strong>tous les groupes</strong> pour confirmer leur présence.
                </p>
              </div>

              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des événements approuvés...</p>
                </div>
              ) : approvedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
                  <h4 className="text-lg font-semibold mb-2">Aucun événement approuvé</h4>
                  <p className="mb-4">Vous devez d'abord créer et approuver des événements avant de pouvoir générer des QR codes.</p>
                  <p className="text-sm">Allez dans l'onglet "Événements" pour créer un nouvel événement ou approuver des demandes existantes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedEvents.map((event) => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-800">{event.title}</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}
                            </div>
                            <div className="flex items-center">
                              <Users size={14} className="mr-1" />
                              {event.groupName}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateQR(event)}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                        >
                          <QrCode size={14} className="mr-1" />
                          Générer QR
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">QR Codes Actifs</h4>
                <p className="text-gray-700 text-sm">
                  Gérez les QR codes actifs. Ils sont visibles par <strong>tous les groupes</strong> et expirent automatiquement après 24h.
                </p>
              </div>

              {qrCodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QrCode size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Aucun QR code actif pour le moment</p>
                  <p className="text-sm">Générez un QR code depuis l'onglet "Générer QR Code"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {qrCodes.map((qrCode) => (
                    <div key={qrCode.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 text-sm">{qrCode.eventTitle}</h5>
                          <div className="text-xs text-gray-600 space-y-1 mt-1">
                            <div className="flex items-center">
                              <Calendar size={12} className="mr-1" />
                              {new Date(qrCode.eventDate).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              Expire: {new Date(qrCode.expiresAt).toLocaleString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Users size={12} className="mr-1" />
                              {qrCode.groupName}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setGeneratedQR(qrCode);
                              setShowQRModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Voir QR Code"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeactivateQR(qrCode.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Désactiver"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Créé par {qrCode.createdBy} le {new Date(qrCode.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Code Display Modal */}
        {showQRModal && generatedQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">QR Code Généré</h3>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{generatedQR.eventTitle}</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(generatedQR.eventDate).toLocaleDateString('fr-FR')} à {generatedQR.eventTime}
                  </p>
                </div>

                <QRCodeDisplay qrCode={generatedQR} />

                <div className="mt-6 space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <Clock size={16} className="text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Expiration</p>
                        <p className="text-yellow-700">
                          Ce QR code expirera le {new Date(generatedQR.expiresAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <Users size={16} className="text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Utilisation</p>
                        <p className="text-blue-700">
                          <strong>Tous les groupes</strong> peuvent scanner ce code pour confirmer leur présence à l'événement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeManager;