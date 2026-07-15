import React, { useState, useMemo } from 'react';
import { Trip } from '../types';
import { Search, Filter, Edit, CheckCircle2, AlertTriangle, Play, MapPin, Fuel, ShieldCheck, HelpCircle } from 'lucide-react';

interface TripListProps {
  trips: Trip[];
  onEditClick: (trip: Trip) => void;
  onCompleteClick: (trip: Trip) => void;
  onDelayClick: (trip: Trip) => void;
  onDeleteClick: (trip: Trip) => void;
  canManage?: boolean;
}

export default function TripList({
  trips,
  onEditClick,
  onCompleteClick,
  onDelayClick,
  onDeleteClick,
  canManage = true,
}: TripListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter Trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchesSearch =
        t.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.dispatcher.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  // Format date time nicely
  const formatDateTime = (dtStr?: string) => {
    if (!dtStr) return '-';
    try {
      const date = new Date(dtStr);
      return date.toLocaleString('km-KH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Phnom_Penh',
      });
    } catch (e) {
      return dtStr;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ស្វែងរកតាម លេខឡាន ផ្លូវដឹក ឬអ្នកគ្រប់គ្រង..."
              className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer font-semibold"
            >
              <option value="All">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="In Progress">កំពុងធ្វើដំណើរ (In Progress)</option>
              <option value="Completed">បានបញ្ចប់ (Completed)</option>
              <option value="Delayed">យឺតយ៉ាវ (Delayed)</option>
            </select>
            <Filter className="absolute right-3 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredTrips.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">លេខឡាន</th>
                    <th className="py-2.5 px-3">ខ្សែរត់ / ផ្លូវដឹក</th>
                    <th className="py-2.5 px-3">ចម្ងាយ & ប្រេងម៉ាស៊ូត</th>
                    <th className="py-2.5 px-3">រយៈពេល និងតម្លៃទំនិញ</th>
                    <th className="py-2.5 px-3">អ្នកគ្រប់គ្រង & ថ្ងៃម៉ោងទៅដល់</th>
                    <th className="py-2.5 px-3">ស្ថានភាព</th>
                    {canManage && <th className="py-2.5 px-4 text-right">សកម្មភាព</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredTrips.map((trip) => (
                    <tr key={trip.tripId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] border border-blue-100">
                          {trip.plateNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{trip.routeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        <div className="space-y-0.5">
                          <div className="text-slate-800">{trip.distanceKm} គម (KM)</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                            <Fuel className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>ប្រេង៖ {trip.fuelAllocated} លីត្រ</span>
                          </div>
                          {trip.commission !== undefined && trip.commission > 0 && (
                            <div className="text-[10px] text-amber-600 flex items-center gap-1 font-sans">
                              <span className="font-bold">កម្រៃ៖ ${trip.commission}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-semibold">{trip.estDuration}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">${trip.cargoValue.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="text-slate-500 font-semibold">{trip.dispatcher}</div>
                          {trip.status === 'Completed' ? (
                            <div className="text-[10px] text-emerald-600 font-semibold">{formatDateTime(trip.actualArrivalDateTime)}</div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium">កំពុងរត់...</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                          trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          trip.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {trip.status === 'In Progress' && <Play className="h-2 w-2 text-blue-500 animate-pulse fill-blue-500" />}
                          {trip.status === 'Completed' && <CheckCircle2 className="h-2 w-2 text-emerald-500" />}
                          {trip.status === 'Delayed' && <AlertTriangle className="h-2 w-2 text-amber-500" />}
                          {trip.status === 'In Progress' ? 'កំពុងធ្វើដំណើរ' :
                           trip.status === 'Completed' ? 'បានបញ្ចប់' :
                           'យឺតយ៉ាវ'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {trip.status !== 'Completed' && (
                            <button
                              onClick={() => onCompleteClick(trip)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold transition-all border border-emerald-100 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              បញ្ចប់ជើង
                            </button>
                          )}
                          {trip.status === 'In Progress' && (
                            <button
                              onClick={() => onDelayClick(trip)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold transition-all border border-amber-100 cursor-pointer"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              យឺតយ៉ាវ
                            </button>
                          )}
                          <button
                            onClick={() => onEditClick(trip)}
                            className="inline-flex items-center gap-1 p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="កែប្រែ"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteClick(trip)}
                            className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                            title="លុបចោល"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredTrips.map((trip) => (
                <div key={trip.tripId} className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-900 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">
                      {trip.plateNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                      trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      trip.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {trip.status === 'In Progress' && <Play className="h-2.5 w-2.5 text-blue-500 animate-pulse fill-blue-500" />}
                      {trip.status === 'Completed' ? 'បានបញ្ចប់' :
                       trip.status === 'Delayed' ? 'យឺតយ៉ាវ' :
                       'កំពុងដំណើរ'}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span>{trip.routeName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div>ចម្ងាយ៖ <strong className="text-slate-800">{trip.distanceKm} គម</strong></div>
                      <div>ប្រេង៖ <strong className="text-slate-800">{trip.fuelAllocated} លីត្រ</strong></div>
                      <div>រយៈពេល៖ <strong className="text-slate-800">{trip.estDuration}</strong></div>
                      <div>តម្លៃឥវ៉ាន់៖ <strong className="text-emerald-600">${trip.cargoValue}</strong></div>
                      {trip.commission !== undefined && trip.commission > 0 && (
                        <div className="col-span-2 text-amber-600 font-bold">កម្រៃជើងសារ៖ ${trip.commission}</div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-200">
                      អ្នកចាត់ចែង៖ <strong>{trip.dispatcher}</strong>
                      {trip.status === 'Completed' && (
                        <div className="text-[10px] text-emerald-600 font-semibold">ទៅដល់៖ {formatDateTime(trip.actualArrivalDateTime)}</div>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
                      {trip.status !== 'Completed' && (
                        <button
                          onClick={() => onCompleteClick(trip)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold transition-all border border-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          បញ្ចប់ជើង
                        </button>
                      )}
                      {trip.status === 'In Progress' && (
                        <button
                          onClick={() => onDelayClick(trip)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-xs font-bold transition-all border border-amber-100"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditClick(trip)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-all"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(trip)}
                        className="p-1.5 text-slate-400 hover:text-red-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-all"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-sans">
            រកមិនឃើញទិន្នន័យជើងដឹកជញ្ជូនទេ (No trips found)
          </div>
        )}
      </div>
    </div>
  );
}
