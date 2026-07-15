import React, { useState, useMemo } from 'react';
import { Departure } from '../types';
import { Plus, Search, Filter, Edit, Ban, Truck, Calendar, MapPin, Eye, Fuel, DollarSign } from 'lucide-react';

interface DepartureListProps {
  departures: Departure[];
  onAddClick: () => void;
  onEditClick: (departure: Departure) => void;
  onCancelClick: (departure: Departure) => void;
  onDispatchClick: (departure: Departure) => void;
  canManage?: boolean;
}

export default function DepartureList({
  departures,
  onAddClick,
  onEditClick,
  onCancelClick,
  onDispatchClick,
  canManage = true,
}: DepartureListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter Departures
  const filteredDepartures = useMemo(() => {
    return departures.filter((d) => {
      const matchesSearch =
        d.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.endLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.cargoType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [departures, searchTerm, statusFilter]);

  // Format local date time nicely
  const formatDateTime = (dtStr: string) => {
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
              placeholder="ស្វែងរកតាម លេខឡាន អ្នកបើកបរ គោលដៅ..."
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
              <option value="Scheduled">គ្រោងទុក (Scheduled)</option>
              <option value="Dispatched">ចេញដំណើរហើយ (Dispatched)</option>
              <option value="Arrived">បានទៅដល់ (Arrived)</option>
              <option value="Cancelled">បានលុបចោល (Cancelled)</option>
            </select>
            <Filter className="absolute right-3 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Add Button */}
        {canManage && (
          <button
            onClick={onAddClick}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            រៀបចំការចេញដំណើរថ្មី (Schedule Departure)
          </button>
        )}
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {filteredDepartures.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">លេខកូដ (ID)</th>
                    <th className="py-2.5 px-3">ព័ត៌មានឡាន និងអ្នកបើកបរ</th>
                    <th className="py-2.5 px-3">ថ្ងៃម៉ោងចេញដំណើរ</th>
                    <th className="py-2.5 px-3">ផ្លូវដឹកជញ្ជូន (Route)</th>
                    <th className="py-2.5 px-3 font-semibold">កម្រៃជើងសារ/ប្រេង និងកំណត់សម្គាល់</th>
                    <th className="py-2.5 px-3">ស្ថានភាព</th>
                    {canManage && <th className="py-2.5 px-4 text-right">សកម្មភាព (Actions)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredDepartures.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-medium">{dep.id.slice(0, 8)}...</td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                            {dep.plateNumber}
                          </span>
                          <div className="text-slate-500 font-semibold text-[11px] pl-0.5 mt-1">{dep.driverName}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          <span>{formatDateTime(dep.departureDateTime)}</span>
                        </div>
                        {dep.createdAt && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 pl-5">
                            បង្កើត៖ {formatDateTime(dep.createdAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {dep.startLocation}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {dep.endLocation}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {dep.commission !== undefined && dep.commission > 0 ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">
                                <DollarSign className="h-2.5 w-2.5 shrink-0 text-amber-500" />
                                ${dep.commission}
                              </span>
                            ) : null}
                            {dep.fuelLiters !== undefined && dep.fuelLiters > 0 ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">
                                <Fuel className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
                                {dep.fuelLiters} L
                              </span>
                            ) : null}
                            {((dep.commission === undefined || dep.commission <= 0) && (dep.fuelLiters === undefined || dep.fuelLiters <= 0)) && (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </div>
                          {dep.notes && (
                            <div className="text-[10px] text-slate-500 max-w-[180px] truncate" title={dep.notes}>
                              {dep.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                          dep.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          dep.status === 'Arrived' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          dep.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {dep.status === 'Scheduled' ? 'គ្រោងទុក' :
                           dep.status === 'Dispatched' ? 'កំពុងដឹក' :
                           dep.status === 'Arrived' ? 'បានដល់' :
                           'បានលុប'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          {dep.status === 'Scheduled' && (
                            <button
                              onClick={() => onDispatchClick(dep)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold transition-all border border-blue-100 cursor-pointer"
                            >
                              <Truck className="h-3 w-3" />
                              ចាត់ចែងជើងដឹក
                            </button>
                          )}
                          <button
                            onClick={() => onEditClick(dep)}
                            className="inline-flex items-center gap-1 p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            title="កែប្រែ"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {dep.status !== 'Cancelled' && dep.status !== 'Arrived' && (
                            <button
                              onClick={() => onCancelClick(dep)}
                              className="inline-flex items-center gap-1 p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="លុបចោល"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredDepartures.map((dep) => (
                <div key={dep.id} className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                      {dep.plateNumber}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                      dep.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      dep.status === 'Arrived' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      dep.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {dep.status === 'Scheduled' ? 'គ្រោងទុក' :
                       dep.status === 'Dispatched' ? 'កំពុងដឹក' :
                       dep.status === 'Arrived' ? 'បានដល់' :
                       'បានលុប'}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div className="text-xs font-bold text-slate-800">{dep.driverName}</div>
                    <div className="text-xs flex items-center gap-1.5 font-bold">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span>{formatDateTime(dep.departureDateTime)}</span>
                    </div>
                    {dep.createdAt && (
                      <div className="text-[10px] text-slate-400 font-normal pl-5">
                        បង្កើត៖ {formatDateTime(dep.createdAt)}
                      </div>
                    )}
                    <div className="text-xs flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{dep.startLocation} ➔ {dep.endLocation}</span>
                    </div>
                    {dep.notes && (
                      <div className="text-xs text-slate-500 font-medium">
                        កំណត់សម្គាល់៖ {dep.notes}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dep.commission !== undefined && dep.commission > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">
                          <DollarSign className="h-3 w-3 text-amber-500" />
                          កម្រៃ៖ ${dep.commission}
                        </span>
                      )}
                      {dep.fuelLiters !== undefined && dep.fuelLiters > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">
                          <Fuel className="h-3 w-3 text-emerald-500" />
                          ប្រេង៖ {dep.fuelLiters} លីត្រ
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-200">
                      {dep.status === 'Scheduled' && (
                        <button
                          onClick={() => onDispatchClick(dep)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold transition-all border border-blue-100"
                        >
                          <Truck className="h-3 w-3" />
                          ចាត់ចែង (Dispatch)
                        </button>
                      )}
                      <button
                        onClick={() => onEditClick(dep)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-all"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      {dep.status !== 'Cancelled' && dep.status !== 'Arrived' && (
                        <button
                          onClick={() => onCancelClick(dep)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-all"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-sans">
            រកមិនឃើញទិន្នន័យចាកចេញរបស់ឡានទេ (No departures found)
          </div>
        )}
      </div>
    </div>
  );
}
