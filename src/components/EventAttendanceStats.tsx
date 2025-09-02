import React, { useState, useEffect } from 'react';
import { QRAttendanceService } from '../utils/qrAttendanceService';
import { EventService } from '../utils/eventService';
import { AttendanceRecord, EventRequest } from '../types';
import { Users, Calendar, Clock, CheckCircle, Eye, RefreshCw, BarChart3, PieChart } from 'lucide-react';

interface EventAttendanceStatsProps {
  // Props optionnelles pour filtrage
}

const EventAttendanceStats: React.FC<EventAttendanceStatsProps> = () => {
  const [events, setEvents] = useState<EventRequest[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

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

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const uniqueUsers = new Set(attendanceRecords.map(record => record.userId)).size;

    // Statistiques par groupe
    const groupStats = attendanceRecords.reduce((acc, record) => {
      const group = record.userGroup;
      if (!acc[group]) {
        acc[group] = { total: 0, unique: new Set() };
      }
      acc[group].total++;
      acc[group].unique.add(record.userId);
      return acc;
    }, {} as Record<string, { total: number; unique: Set<string> }>);

    // Convertir les Sets en nombres pour l'affichage
    const groupStatsFormatted = Object.entries(groupStats).map(([group, stats]) => ({
      group,
      total: stats.total,
      unique: stats.unique.size
    }));

    return { total, uniqueUsers, groupStats: groupStatsFormatted };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des statistiques d'événements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <BarChart3 className="mr-2" />
          Statistiques de Présence par Événement
        </h4>
        <p className="text-blue-700 text-sm">
          Suivez la participation de chaque groupe à vos événements approuvés.
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
              <div className="text-xs text-gray-400 mt-1">
                {event.groupName}
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

          {/* Global Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Total Présences</p>
                  <p className="text-3xl font-bold text-green-600">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Membres Uniques</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.uniqueUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Group Stats */}
          <div className="mb-6">
            <h6 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <PieChart className="mr-2 text-purple-600" />
              Répartition par Groupe
            </h6>
            {stats.groupStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune présence enregistrée pour cet événement.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.groupStats.map((groupStat) => (
                  <div key={groupStat.group} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">{groupStat.group}</div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {groupStat.unique} membre{groupStat.unique > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {groupStat.total}
                    </div>
                    <div className="text-xs text-gray-600">
                      présence{groupStat.total > 1 ? 's' : ''} enregistrée{groupStat.total > 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Records Table */}
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
                        Type
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.qrCodeId.startsWith('manual-')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {record.qrCodeId.startsWith('manual-') ? 'Manuel' : 'Scan'}
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

export default EventAttendanceStats;