import React, { useState, useRef, useEffect } from 'react';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { QrCode, Camera, CheckCircle, XCircle, Clock, MapPin, StopCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    eventData?: any;
  } | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [matricule, setMatricule] = useState('');
  const [showMatriculeInput, setShowMatriculeInput] = useState(false);
  const [scannedQRData, setScannedQRData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get current user info
  const currentUserData = localStorage.getItem('youth_auth');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : {};

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        scanQRCode();
      }
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setCameraActive(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log('QR Code détecté:', code.data);
          handleScanQRCode(code.data);
          stopCamera();
          return;
        }
      }

      if (cameraActive) {
        animationFrameRef.current = requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleScanQRCode = async (qrCodeData: string) => {
    // Stocker les données du QR code et demander le matricule
    setScannedQRData(qrCodeData);
    setShowMatriculeInput(true);
    stopCamera(); // Arrêter la caméra pendant la saisie du matricule
  };

  const handleMatriculeSubmit = async () => {
    if (!matricule.trim()) {
      setScanResult({
        success: false,
        message: 'Veuillez saisir votre matricule'
      });
      return;
    }

    if (!scannedQRData) {
      setScanResult({
        success: false,
        message: 'Erreur: Données QR code manquantes'
      });
      return;
    }

    setScanning(true);
    setShowMatriculeInput(false);

    try {
      // Utiliser le matricule comme identifiant
      const result = await QRAttendanceService.scanQRCode(scannedQRData, {
        userId: matricule.trim(),
        userName: `Membre ${matricule.trim()}`,
        userGroup: 'À déterminer' // Le groupe sera déterminé par le matricule
      });

      if (result) {
        setScanResult({
          success: true,
          message: `Présence enregistrée pour "${result.eventTitle}" avec matricule ${matricule}`,
          eventData: result
        });
        // Reset pour le prochain scan
        setMatricule('');
        setScannedQRData(null);
      } else {
        setScanResult({
          success: false,
          message: 'Erreur lors de l\'enregistrement de la présence. QR code invalide ou expiré.'
        });
      }
    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.message || 'Erreur lors du scan du QR code'
      });
    } finally {
      setScanning(false);
    }
  };

  // Nettoyer les ressources quand le modal se ferme
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            console.log('QR Code détecté dans l\'image:', code.data);
            handleScanQRCode(code.data);
          } else {
            setScanResult({
              success: false,
              message: 'Aucun QR code trouvé dans cette image. Essayez une autre image ou utilisez la saisie manuelle.'
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      setScanResult({
        success: false,
        message: 'Veuillez saisir un code QR valide'
      });
      return;
    }

    handleScanQRCode(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-blue-600" />
              Scanner QR Code
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">
              Scannez le QR code de l'événement pour confirmer votre présence.
              <strong>Tous les QR codes actifs sont visibles par tous les groupes.</strong>
            </p>
          </div>

          {/* Matricule Input */}
          {showMatriculeInput && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-lg font-medium text-blue-800 mb-3">Saisir votre matricule</h4>
              <p className="text-blue-700 text-sm mb-4">
                QR code scanné avec succès ! Veuillez saisir votre matricule pour confirmer votre présence.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matricule (ex: 25A3, 25B7)
                  </label>
                  <input
                    type="text"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre matricule"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleMatriculeSubmit}
                    disabled={scanning || !matricule.trim()}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {scanning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Confirmer présence
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowMatriculeInput(false);
                      setScannedQRData(null);
                      setMatricule('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className={`mb-6 p-4 rounded-lg border ${
              scanResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                {scanResult.success ? (
                  <CheckCircle size={20} className="text-green-600 mr-3 mt-0.5" />
                ) : (
                  <XCircle size={20} className="text-red-600 mr-3 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    scanResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {scanResult.success ? 'Présence enregistrée !' : 'Erreur'}
                  </p>
                  <p className={`text-sm ${
                    scanResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {scanResult.message}
                  </p>
                  {scanResult.success && scanResult.eventData && (
                    <div className="mt-2 text-xs text-green-600">
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Scanné le {new Date(scanResult.eventData.scannedAt).toLocaleString('fr-FR')}
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPin size={12} className="mr-1" />
                        Événement: {scanResult.eventData.eventTitle}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          <div className="mb-6">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera size={48} className="mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">Scanner par caméra</h4>

              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{cameraError}</p>
                </div>
              )}

              {!cameraActive ? (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Utilisez votre caméra pour scanner un QR code directement.
                  </p>
                  <button
                    onClick={startCamera}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center mx-auto"
                  >
                    <Camera size={18} className="mr-2" />
                    Ouvrir caméra
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-w-sm mx-auto rounded-lg border-2 border-green-300"
                      style={{ maxHeight: '200px' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                        🔍 Scanning...
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
                  >
                    <StopCircle size={18} className="mr-2" />
                    Arrêter caméra
                  </button>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Ou scannez depuis une image :</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Manual Code Entry */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Saisie manuelle</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code QR (fourni par le responsable)
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Collez ici le code du QR code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              <button
                onClick={handleManualScan}
                disabled={scanning || !manualCode.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {scanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <QrCode size={18} className="mr-2" />
                    Enregistrer ma présence
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Comment ça marche ?</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Les QR codes sont visibles par <strong>tous les groupes</strong></li>
              <li>• Demandez le code QR à n'importe quel responsable</li>
              <li>• Copiez-collez le code dans le champ ci-dessus</li>
              <li>• Cliquez sur "Enregistrer ma présence"</li>
              <li>• Votre présence sera automatiquement enregistrée</li>
            </ul>
          </div>

          {/* User Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p><strong>Utilisateur:</strong> {currentUser.name || 'Non connecté'}</p>
              <p><strong>Groupe:</strong> {currentUser.groupName || 'Non défini'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
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

export default QRCodeScanner;