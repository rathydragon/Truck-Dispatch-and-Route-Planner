import React, { useMemo } from 'react';
import { Departure, Trip } from '../types';
import { Truck, Fuel, CheckCircle2, Clock } from 'lucide-react';

interface DashboardProps {
  departures: Departure[];
  trips: Trip[];
}

export default function Dashboard({ departures, trips }: DashboardProps) {
  // 1. Calculate General Statistics
  const stats = useMemo(() => {
    const totalDepartures = departures.length;
    const activeTrips = trips.filter(t => t.status === 'In Progress').length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;
    
    const totalWeight = departures.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
    const totalFuel = trips.reduce((sum, t) => sum + (Number(t.fuelAllocated) || 0), 0);

    return {
      totalDepartures,
      activeTrips,
      completedTrips,
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalFuel: Math.round(totalFuel)
    };
  }, [departures, trips]);

  // 2. Get active dispatcher list or recent actions
  const recentDepartures = useMemo(() => {
    return [...departures]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  }, [departures]);

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Departures */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ចេញដំណើរសរុប (Total Departures)</span>
            <span className="text-xl lg:text-2xl font-extrabold text-slate-800">{stats.totalDepartures} ដង</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ជើងដឹកកំពុងរត់ (Active Trips)</span>
            <span className="text-xl lg:text-2xl font-extrabold text-blue-600">{stats.activeTrips} ជើង</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shrink-0">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Completed Trips */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">បានបញ្ចប់ជោគជ័យ (Completed)</span>
            <span className="text-xl lg:text-2xl font-extrabold text-emerald-600">{stats.completedTrips} ជើង</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Fuel Allocated */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ប្រេងម៉ាស៊ូតបានផ្តល់ (Fuel Allocated)</span>
            <span className="text-xl lg:text-2xl font-extrabold text-slate-800">{stats.totalFuel.toLocaleString()} លីត្រ</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100 shrink-0">
            <Fuel className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Dispatches */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-800 font-sans flex items-center gap-2 uppercase tracking-wide">
            <Truck className="h-4 w-4 text-blue-600 shrink-0" />
            ការចេញដំណើរថ្មីៗ (Recent Departures)
          </h3>
        </div>
        <div className="overflow-x-auto">
          {recentDepartures.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-bold uppercase bg-slate-50 border-b border-slate-200">
                  <th className="py-2.5 px-3 rounded-l-md">លេខឡាន</th>
                  <th className="py-2.5 px-3">ឈ្មោះអ្នកបើកបរ</th>
                  <th className="py-2.5 px-3">គោលដៅ</th>
                  <th className="py-2.5 px-3">កម្រៃជើងសារ</th>
                  <th className="py-2.5 px-3 rounded-r-md">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
                {recentDepartures.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{dep.plateNumber}</td>
                    <td className="py-2.5 px-3">{dep.driverName}</td>
                    <td className="py-2.5 px-3 font-semibold">{dep.startLocation} ➔ {dep.endLocation}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-600">{dep.commission ? `$${dep.commission}` : '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        dep.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        dep.status === 'Arrived' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        dep.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {dep.status === 'Scheduled' ? 'គ្រោងទុក' :
                         dep.status === 'Dispatched' ? 'កំពុងដឹក' :
                         dep.status === 'Arrived' ? 'បានដល់' :
                         'បានលុប'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs font-sans">
              មិនទាន់មានការចេញដំណើរត្រូវបានបញ្ចូលនៅឡើយទេ (No departures entered yet)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
