import React, { useState, useEffect } from 'react';
import { QRCode } from '../types';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { QrCode, Clock, Users, Calendar, Eye, AlertTriangle } from 'lucide-react';

interface QRCodeDisplayProps {
  groupName?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ groupName }) => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);

  useEffect(() => {
    loadQRCodes();
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

  const QRCodeModal: React.FC<{ qrCode: QRCode; onClose: () => void }> = ({ qrCode, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">QR Code pour Pointage</h3>
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
            <div className="text-center mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">{qrCode.eventTitle}</h4>
              <p className="text-sm text-gray-600 mb-4">
                {new Date(qrCode.eventDate).toLocaleDateString('fr-FR')} à {qrCode.eventTime}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300 inline-block">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <QrCode size={64} className="text-gray-400" />
                  <div className="absolute text-xs text-gray-500 mt-16">
                    QR Code Placeholder
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Clock size={16} className="text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Expiration</p>
                    <p className="text-yellow-700">
                      Ce QR code expire le {new Date(qrCode.expiresAt).toLocaleString('fr-FR')}
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
                      Présentez ce QR code aux membres de votre groupe pour qu'ils scannent et confirment leur présence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
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
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">QR Codes Actifs</h4>
        <p className="text-blue-700 text-sm">
          Ces QR codes sont générés par l'administrateur pour les événements approuvés.
          Ils sont visibles par <strong>tous les groupes</strong>. Présentez-les aux membres de votre groupe pour qu'ils scannent et confirment leur présence.
        </p>
      </div>

      {qrCodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h4 className="text-lg font-semibold mb-2">Aucun QR code actif</h4>
          <p className="mb-4">Il n'y a actuellement aucun QR code actif pour les événements.</p>
          <p className="text-sm">Contactez l'administrateur pour créer des événements et générer des QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <button
                  onClick={() => setSelectedQR(qrCode)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Voir QR Code"
                >
                  <Eye size={20} />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                Créé par {qrCode.createdBy} le {new Date(qrCode.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <QRCodeModal
          qrCode={selectedQR}
          onClose={() => setSelectedQR(null)}
        />
      )}
    </div>
  );
};

export default QRCodeDisplay;