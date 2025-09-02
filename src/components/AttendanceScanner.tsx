import React, { useState, useEffect } from 'react';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { MatriculeService } from '../utils/matriculeService';
import { AttendanceRequest } from '../utils/attendanceService';
import { QrCode, CheckCircle, XCircle, User, Shield, AlertTriangle } from 'lucide-react';

interface AttendanceScannerProps {
  onClose: () => void;
}


const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ onClose }) => {
  const [step, setStep] = useState<'scan' | 'matricule' | 'confirmation' | 'success'>('scan');
  const [scannedQRData, setScannedQRData] = useState<string>('');
  const [matricule, setMatricule] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [attendanceRequest, setAttendanceRequest] = useState<AttendanceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Get current user (group leader)
  const currentUserData = localStorage.getItem('youth_auth');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : {};

  useEffect(() => {
    // Check for pending attendance requests for this group leader
    checkPendingRequests();
  }, []);

  const checkPendingRequests = async () => {
    // This would check for pending requests in the database
    // For now, we'll simulate this
  };

  const handleQRScan = async (qrData: string) => {
    setLoading(true);
    setError('');

    try {
      // Decode QR data
      const decodedData = JSON.parse(atob(qrData));

      // Validate QR code
      const qrCode = await QRAttendanceService.getQRCodeById(decodedData.id);
      if (!qrCode || !qrCode.isActive) {
        throw new Error('QR code invalide ou expiré');
      }

      setScannedQRData(qrData);
      setStep('matricule');
    } catch (error: any) {
      setError(error.message || 'Erreur lors du scan du QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleMatriculeSubmit = async () => {
    if (!matricule.trim()) {
      setError('Veuillez saisir votre matricule');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find user by matricule
      const user = await MatriculeService.findYouthByMatricule(matricule.trim());
      if (!user) {
        throw new Error('Matricule non trouvé. Vérifiez votre matricule.');
      }

      // Check if user is in the same group as the group leader
      if (user.groupe_assigne !== currentUser.groupName) {
        throw new Error('Ce matricule n\'appartient pas à votre groupe.');
      }

      setUserInfo(user);

      // Create attendance request for group leader approval
      const request: AttendanceRequest = {
        id: crypto.randomUUID(),
        matricule: matricule.trim(),
        userName: user.nom_prenom || user.nomPrenom,
        userGroup: user.groupe_assigne || user.groupeAssigne,
        eventTitle: JSON.parse(atob(scannedQRData)).eventTitle,
        eventId: JSON.parse(atob(scannedQRData)).eventId,
        qrCodeId: JSON.parse(atob(scannedQRData)).id,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        groupLeaderId: currentUser.id || 'unknown',
        groupLeaderName: currentUser.name || 'Responsable'
      };

      setAttendanceRequest(request);
      setStep('confirmation');

    } catch (error: any) {
      setError(error.message || 'Erreur lors de la vérification du matricule');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (approved: boolean) => {
    if (!attendanceRequest) return;

    setLoading(true);
    setError('');

    try {
      if (approved) {
        // Record attendance
        const result = await QRAttendanceService.scanQRCode(scannedQRData, {
          userId: userInfo.id,
          userName: userInfo.nom_prenom || userInfo.nomPrenom,
          userGroup: userInfo.groupe_assigne || userInfo.groupeAssigne
        });

        if (!result) {
          throw new Error('Erreur lors de l\'enregistrement de la présence');
        }
      }

      // Update request status
      setAttendanceRequest({
        ...attendanceRequest,
        status: approved ? 'approved' : 'rejected'
      });

      setStep('success');

    } catch (error: any) {
      setError(error.message || 'Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setStep('scan');
    setScannedQRData('');
    setMatricule('');
    setUserInfo(null);
    setAttendanceRequest(null);
    setError('');
  };

  if (step === 'scan') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <QrCode className="w-6 h-6 mr-2 text-blue-600" />
                Scanner de Présence
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
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-4">
                Scannez le QR code de l'événement pour enregistrer une présence
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <XCircle size={16} className="text-red-600 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <QrCode size={48} className="mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-800 mb-2">Scan du QR Code</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Fonctionnalité en développement. Utilisez la saisie manuelle.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code QR (manuel)
                </label>
                <textarea
                  value={scannedQRData}
                  onChange={(e) => setScannedQRData(e.target.value)}
                  placeholder="Collez ici le code du QR code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              <button
                onClick={() => handleQRScan(scannedQRData)}
                disabled={loading || !scannedQRData.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Vérification...
                  </>
                ) : (
                  <>
                    <QrCode size={18} className="mr-2" />
                    Vérifier QR Code
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-end">
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
  }

  if (step === 'matricule') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <User className="w-6 h-6 mr-2 text-green-600" />
                Saisie du Matricule
              </h3>
              <button
                onClick={resetScanner}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm">
                QR code validé ! Saisissez maintenant votre matricule pour confirmer votre identité.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <XCircle size={16} className="text-red-600 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre Matricule
                </label>
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="Ex: 25A3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 4 caractères (ex: 25A3)
                </p>
              </div>

              <button
                onClick={handleMatriculeSubmit}
                disabled={loading || !matricule.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Vérifier Matricule
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={resetScanner}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-orange-600" />
                Confirmation Requise
              </h3>
              <button
                onClick={resetScanner}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">Demande de présence</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Événement:</strong> {attendanceRequest?.eventTitle}</p>
                  <p><strong>Membre:</strong> {attendanceRequest?.userName}</p>
                  <p><strong>Groupe:</strong> {attendanceRequest?.userGroup}</p>
                  <p><strong>Matricule:</strong> {attendanceRequest?.matricule}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle size={16} className="text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Confirmation requise</p>
                  <p className="text-yellow-700">
                    En tant que responsable du groupe, vous devez confirmer la présence de ce membre.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleConfirmation(false)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <XCircle size={18} className="mr-2" />
                Refuser
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={resetScanner}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Présence Enregistrée
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                attendanceRequest?.status === 'approved'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {attendanceRequest?.status === 'approved' ? (
                  <CheckCircle size={32} />
                ) : (
                  <XCircle size={32} />
                )}
              </div>

              <h4 className={`text-lg font-semibold mb-2 ${
                attendanceRequest?.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {attendanceRequest?.status === 'approved'
                  ? 'Présence confirmée !'
                  : 'Présence refusée'
                }
              </h4>

              <p className="text-gray-600 text-sm mb-4">
                {attendanceRequest?.status === 'approved'
                  ? 'La présence a été enregistrée avec succès.'
                  : 'La demande de présence a été refusée.'
                }
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Événement:</strong> {attendanceRequest?.eventTitle}</p>
                <p><strong>Membre:</strong> {attendanceRequest?.userName}</p>
                <p><strong>Matricule:</strong> {attendanceRequest?.matricule}</p>
                <p><strong>Statut:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    attendanceRequest?.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {attendanceRequest?.status === 'approved' ? 'Approuvé' : 'Refusé'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between">
              <button
                onClick={resetScanner}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Nouveau scan
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
  }

  return null;
};

export default AttendanceScanner;