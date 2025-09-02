import React, { useState, useEffect } from 'react';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { EventService } from '../utils/eventService';
import { AttendanceRecord, EventRequest } from '../types';
import { Users, Calendar, Clock, CheckCircle, Eye, RefreshCw, Plus, UserPlus } from 'lucide-react';

interface AttendanceStatsProps {
  groupName?: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ groupName }) => {
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [showManualAttendance, setShowManualAttendance] = useState(false);
  const [manualMatricule, setManualMatricule] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsData = await EventService.getApprovedEvents();
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
        loadAttendanceRecords(eventsData[0].id || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async (eventId: string) => {
    setRecordsLoading(true);
    try {
      const records = await QRAttendanceService.getAttendanceRecordsByEvent(eventId);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error);
      setAttendanceRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleEventChange = (event: EventRequest) => {
    setSelectedEvent(event);
    loadAttendanceRecords(event.id || '');
  };

  const handleManualAttendance = async () => {
    if (!manualMatricule.trim() || !manualName.trim() || !selectedEvent) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setManualLoading(true);
    try {
      const result = await QRAttendanceService.recordManualAttendance({
        eventId: selectedEvent.id || '',
        eventTitle: selectedEvent.title,
        userId: manualMatricule.trim(),
        userName: manualName.trim(),
        userGroup: groupName || 'Non défini'
      });

      if (result) {
        setAttendanceRecords([...attendanceRecords, result]);
        setManualMatricule('');
        setManualName('');
        setShowManualAttendance(false);
        alert('Présence enregistrée avec succès !');
      } else {
        alert('Erreur lors de l\'enregistrement de la présence');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement manuel:', error);
      alert(error.message || 'Erreur lors de l\'enregistrement de la présence');
    } finally {
      setManualLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const uniqueUsers = new Set(attendanceRecords.map(record => record.userId)).size;
    const recentRecords = attendanceRecords.filter(record => {
      const recordTime = new Date(record.scannedAt);
      const now = new Date();
      const diffInHours = (now.getTime() - recordTime.getTime()) / (1000 * 60 * 60);
      return diffInHours <= 24; // Dernières 24h
    });

    return { total, uniqueUsers, recentRecords: recentRecords.length };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des statistiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">Statistiques de Présence</h4>
        <p className="text-blue-700 text-sm">
          Suivez les présences de votre groupe aux différents événements.
        </p>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <h5 className="text-md font-medium text-gray-800 mb-3">Sélectionner un événement</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => handleEventChange(event)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedEvent?.id === event.id
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-sm">{event.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}
              </div>
            </button>
          ))}
        </div>
        {events.length === 0 && (
          <p className="text-gray-500 text-center py-4">Aucun événement approuvé trouvé.</p>
        )}
      </div>

      {/* Selected Event Stats */}
      {selectedEvent && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold text-gray-800">
              Présences pour : {selectedEvent.title}
            </h5>
            <button
              onClick={() => loadAttendanceRecords(selectedEvent.id || '')}
              className="text-blue-600 hover:text-blue-800 p-2"
              title="Actualiser"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Manual Attendance Button */}
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <button
              onClick={() => setShowManualAttendance(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <UserPlus size={18} className="mr-2" />
              Ajouter présence manuelle
            </button>
          </div>

          {/* Manual Attendance Form */}
          {showManualAttendance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h6 className="font-medium text-yellow-800 mb-3">Ajouter une présence manuellement</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matricule *
                  </label>
                  <input
                    type="text"
                    value={manualMatricule}
                    onChange={(e) => setManualMatricule(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ex: 25A3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Nom et prénom"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleManualAttendance}
                  disabled={manualLoading || !manualMatricule.trim() || !manualName.trim()}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {manualLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Enregistrer présence
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowManualAttendance(false);
                    setManualMatricule('');
                    setManualName('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Total Scans</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Membres Uniques</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.uniqueUsers}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Dernières 24h</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.recentRecords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h6 className="font-medium text-gray-800">Détail des présences</h6>
            </div>
            {recordsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Chargement des présences...</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune présence enregistrée pour cet événement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matricule
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groupe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Heure
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.userId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {record.userName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {record.userGroup}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.scannedAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            Présent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStats;