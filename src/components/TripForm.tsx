import React, { useState, useEffect } from 'react';
import { Departure, Trip, AppSettings } from '../types';
import { X, Navigation, Fuel, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface TripFormProps {
  trip?: Trip | null; // If editing
  departure?: Departure | null; // If generating trip from a specific scheduled departure
  currentUserEmail?: string | null;
  settings?: AppSettings;
  onSave: (data: Omit<Trip, 'tripId'> & { tripId?: string }) => void;
  onClose: () => void;
}

export default function TripForm({ trip, departure, currentUserEmail, settings, onSave, onClose }: TripFormProps) {
  const [routeName, setRouteName] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [fuelAllocated, setFuelAllocated] = useState<number | ''>('');
  const [commission, setCommission] = useState<number | ''>('');
  const [estDuration, setEstDuration] = useState('');
  const [dispatcher, setDispatcher] = useState('');
  const [actualArrivalDateTime, setActualArrivalDateTime] = useState('');
  const [status, setStatus] = useState<Trip['status']>('In Progress');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill route info from departure destinations if available
  useEffect(() => {
    if (trip) {
      setRouteName(trip.routeName);
      setDistanceKm(trip.distanceKm);
      setFuelAllocated(trip.fuelAllocated);
      setCommission(trip.commission !== undefined ? trip.commission : '');
      setEstDuration(trip.estDuration);
      setDispatcher(trip.dispatcher);
      setStatus(trip.status);
      setActualArrivalDateTime(trip.actualArrivalDateTime || '');
    } else if (departure) {
      // Create Route Name based on Start and End Location
      setRouteName(`${departure.startLocation} ➔ ${departure.endLocation}`);
      setDispatcher(currentUserEmail || 'Dispatcher');
      
      // Reasonable defaults based on typical locations
      setDistanceKm(150);
      
      // Try to get default fuel and commission from settings or departure
      const defaultFuel = settings?.fuelAmounts && settings.fuelAmounts.length > 0 ? settings.fuelAmounts[0] : 50;
      const defaultCommission = departure.commission !== undefined && departure.commission > 0
        ? departure.commission
        : (settings?.commissions && settings.commissions.length > 0 ? settings.commissions[0] : 50);
      
      setFuelAllocated(defaultFuel);
      setCommission(defaultCommission);
      setEstDuration('4 ម៉ោង (4 Hours)');
    } else {
      setDispatcher(currentUserEmail || '');
      const defaultFuel = settings?.fuelAmounts && settings.fuelAmounts.length > 0 ? settings.fuelAmounts[0] : '';
      const defaultCommission = settings?.commissions && settings.commissions.length > 0 ? settings.commissions[0] : '';
      setFuelAllocated(defaultFuel);
      setCommission(defaultCommission);
    }
  }, [trip, departure, currentUserEmail, settings]);

  // Handle auto filling Actual Arrival DateTime if marked Completed
  useEffect(() => {
    if (status === 'Completed' && !actualArrivalDateTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setActualArrivalDateTime(now.toISOString().slice(0, 16));
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!routeName.trim()) {
      setError('សូមបញ្ចូលឈ្មោះផ្លូវ (Please enter route name)');
      return;
    }
    if (distanceKm === '' || Number(distanceKm) <= 0) {
      setError('សូមបញ្ចូលចម្ងាយផ្លូវឱ្យបានត្រឹមត្រូវ (Please enter valid distance)');
      return;
    }
    if (fuelAllocated === '' || Number(fuelAllocated) < 0) {
      setError('សូមបញ្ចូលបរិមាណប្រេងដែលបានផ្តល់ (Please enter fuel allocated)');
      return;
    }
    if (commission !== '' && Number(commission) < 0) {
      setError('សូមបញ្ចូលកម្រៃជើងសារឱ្យបានត្រឹមត្រូវ (Please enter valid commission)');
      return;
    }
    if (!estDuration.trim()) {
      setError('សូមបញ្ចូលរយៈពេលប៉ាន់ស្មាន (Please enter estimated duration)');
      return;
    }
    if (!dispatcher.trim()) {
      setError('សូមបញ្ចូលឈ្មោះអ្នកគ្រប់គ្រង (Please enter dispatcher name)');
      return;
    }

    const departureId = trip ? trip.departureId : (departure ? departure.id : '');
    const plateNumber = trip ? trip.plateNumber : (departure ? departure.plateNumber : '');

    onSave({
      ...(trip ? { tripId: trip.tripId } : {}),
      departureId,
      plateNumber,
      routeName: routeName.trim(),
      distanceKm: Number(distanceKm),
      fuelAllocated: Number(fuelAllocated),
      commission: commission === '' ? 0 : Number(commission),
      estDuration: estDuration.trim(),
      dispatcher: dispatcher.trim(),
      actualArrivalDateTime: status === 'Completed' ? actualArrivalDateTime : undefined,
      cargoValue: trip ? trip.cargoValue : 0,
      status,
    });
  };

  return (
    <div id="trip-form-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up my-8">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
              {trip ? 'កែប្រែជើងដឹកជញ្ជូន (Edit Trip)' : 'បង្កើតជើងដឹកជញ្ជូនថ្មី (Dispatch Trip)'}
            </h3>
            {!trip && departure && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                សម្រាប់ឡាន៖ <strong className="text-blue-600 font-mono">{departure.plateNumber}</strong> | អ្នកបើក៖ <strong>{departure.driverName}</strong>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-left">
          {error && (
            <div id="form-error" className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Route Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Navigation className="h-3 w-3 text-blue-500" />
              ឈ្មោះផ្លូវដឹកជញ្ជូន (Route Name) *
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="ឧ. ភ្នំពេញ ➔ កំពង់សោម"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Distance KM */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ចម្ងាយផ្លូវ/គីឡូម៉ែត្រ (Distance in KM) *</label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ឧ. 230"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Fuel Allocated */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Fuel className="h-3 w-3 text-amber-500" />
                ប្រេងម៉ាស៊ូតដែលផ្តល់/លីត្រ (Fuel Allocated in Liters) *
              </label>
              <input
                type="number"
                value={fuelAllocated}
                onChange={(e) => setFuelAllocated(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ឧ. 80"
                list="fuels-list"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
              {settings?.fuelAmounts && (
                <datalist id="fuels-list">
                  {settings.fuelAmounts.map((f, idx) => (
                    <option key={idx} value={f} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Est Duration */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                រយៈពេលប៉ាន់ស្មាន (Est Duration) *
              </label>
              <input
                type="text"
                value={estDuration}
                onChange={(e) => setEstDuration(e.target.value)}
                placeholder="ឧ. 5 ម៉ោង ឬ 1 ថ្ងៃ"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Dispatcher Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">អ្នកគ្រប់គ្រងចាត់ចែង (Dispatcher) *</label>
              <input
                type="text"
                value={dispatcher}
                onChange={(e) => setDispatcher(e.target.value)}
                placeholder="ឈ្មោះអ្នកគ្រប់គ្រង"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Commission */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                កម្រៃជើងសារ/USD (Commission in USD)
              </label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ឧ. 50"
                list="commissions-list"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
              {settings?.commissions && (
                <datalist id="commissions-list">
                  {settings.commissions.map((c, idx) => (
                    <option key={idx} value={c} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ស្ថានភាព (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Trip['status'])}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold cursor-pointer"
              >
                <option value="In Progress">កំពុងធ្វើដំណើរ (In Progress)</option>
                <option value="Completed">បានបញ្ចប់ (Completed)</option>
                <option value="Delayed">យឺតយ៉ាវ (Delayed)</option>
              </select>
            </div>
          </div>

          {/* Actual Arrival Date/Time (Only if Completed) */}
          {status === 'Completed' && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                ថ្ងៃម៉ោងទៅដល់ជាក់ស្តែង (Actual Arrival Date/Time)
              </label>
              <input
                type="datetime-local"
                value={actualArrivalDateTime}
                onChange={(e) => setActualArrivalDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              {trip ? 'រក្សាទុកការកែប្រែ (Save Changes)' : 'បង្កើតជើងដឹកជញ្ជូន (Start Trip)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
