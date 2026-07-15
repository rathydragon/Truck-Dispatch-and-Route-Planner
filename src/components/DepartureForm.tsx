import React, { useState, useEffect } from 'react';
import { Departure, AppSettings } from '../types';
import { X, Calendar, MapPin, Package, AlertCircle, DollarSign, Fuel } from 'lucide-react';

interface DepartureFormProps {
  departure?: Departure | null; // If editing, this will be passed
  settings?: AppSettings;
  onSave: (data: Omit<Departure, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}

export default function DepartureForm({ departure, settings, onSave, onClose }: DepartureFormProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [departureDateTime, setDepartureDateTime] = useState('');
  const [startLocation, setStartLocation] = useState('ភ្នំពេញ (Phnom Penh)');
  const [endLocation, setEndLocation] = useState('');
  const [status, setStatus] = useState<Departure['status']>('Scheduled');
  const [notes, setNotes] = useState('');
  const [commission, setCommission] = useState<number | ''>('');
  const [fuelLiters, setFuelLiters] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  // Load existing data if editing
  useEffect(() => {
    if (departure) {
      setPlateNumber(departure.plateNumber);
      setDriverName(departure.driverName);
      setDepartureDateTime(departure.departureDateTime);
      setStartLocation(departure.startLocation);
      setEndLocation(departure.endLocation);
      setStatus(departure.status);
      setNotes(departure.notes);
      setCommission(departure.commission !== undefined ? departure.commission : '');
      setFuelLiters(departure.fuelLiters !== undefined ? departure.fuelLiters : '');
    } else {
      // Pre-fill date time with current local time in Cambodia formatted for datetime-local
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Phnom_Penh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const cambodiaNow = formatter.format(new Date()).replace(' ', 'T');
      setDepartureDateTime(cambodiaNow);

      const defaultCommission = settings?.commissions && settings.commissions.length > 0 ? settings.commissions[0] : '';
      setCommission(defaultCommission);

      const defaultFuel = settings?.fuelAmounts && settings.fuelAmounts.length > 0 ? settings.fuelAmounts[0] : '';
      setFuelLiters(defaultFuel);
    }
  }, [departure, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!plateNumber.trim()) {
      setError('សូមបញ្ចូលស្លាកលេខឡាន (Please enter truck plate number)');
      return;
    }
    if (!driverName.trim()) {
      setError('សូមបញ្ចូលឈ្មោះអ្នកបើកបរ (Please enter driver name)');
      return;
    }
    if (!departureDateTime) {
      setError('សូមជ្រើសរើសថ្ងៃម៉ោងចេញដំណើរ (Please select departure date/time)');
      return;
    }
    if (!startLocation.trim()) {
      setError('សូមបញ្ចូលកន្លែងចេញដំណើរ (Please enter start location)');
      return;
    }
    if (!endLocation.trim()) {
      setError('សូមបញ្ចូលគោលដៅដឹកជញ្ជូន (Please enter destination)');
      return;
    }
    if (commission !== '' && Number(commission) < 0) {
      setError('សូមបញ្ចូលកម្រៃជើងសារឱ្យបានត្រឹមត្រូវ (Please enter valid commission)');
      return;
    }
    if (fuelLiters !== '' && Number(fuelLiters) < 0) {
      setError('សូមបញ្ចូលបរិមាណប្រេងផ្តល់ជូនឱ្យបានត្រឹមត្រូវ (Please enter valid fuel amount)');
      return;
    }

    onSave({
      ...(departure ? { id: departure.id } : {}),
      plateNumber: plateNumber.trim(),
      driverName: driverName.trim(),
      departureDateTime,
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      cargoType: '',
      weight: 0,
      status,
      notes: notes.trim(),
      commission: commission === '' ? 0 : Number(commission),
      fuelLiters: fuelLiters === '' ? 0 : Number(fuelLiters),
    });
  };

  return (
    <div id="departure-form-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up my-8">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs font-bold text-slate-800 font-sans uppercase tracking-wider">
            {departure ? 'កែប្រែព័ត៌មានការចេញដំណើរ (Edit Departure)' : 'បន្ថែមការចេញដំណើរថ្មី (Schedule Departure)'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <div id="form-error" className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Plate Number */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ស្លាកលេខឡាន (Plate Number) *</label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="ឧ. 3A-4567"
                list="plates-list"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase font-semibold bg-slate-50/30"
              />
              {settings?.plateNumbers && (
                <datalist id="plates-list">
                  {settings.plateNumbers.map((p, idx) => (
                    <option key={idx} value={p} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Driver Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ឈ្មោះអ្នកបើកបរ (Driver Name) *</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="ឧ. សុខ ជា"
                list="drivers-list"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
              {settings?.driverNames && (
                <datalist id="drivers-list">
                  {settings.driverNames.map((d, idx) => (
                    <option key={idx} value={d} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Departure DateTime */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                ថ្ងៃម៉ោងចេញដំណើរ (Departure Date/Time) *
              </label>
              <input
                type="datetime-local"
                value={departureDateTime}
                onChange={(e) => setDepartureDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* Status (Only show if editing) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ស្ថានភាព (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Departure['status'])}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold cursor-pointer"
              >
                <option value="Scheduled">គ្រោងទុក (Scheduled)</option>
                <option value="Dispatched">ចេញដំណើរហើយ (Dispatched)</option>
                <option value="Arrived">បានទៅដល់ (Arrived)</option>
                <option value="Cancelled">បានលុបចោល (Cancelled)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Start Location */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-500" />
                កន្លែងចេញដំណើរ (Start Location) *
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="ឧ. ភ្នំពេញ"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
            </div>

            {/* End Location */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-rose-500" />
                គោលដៅ (End Location/Destination) *
              </label>
              <input
                type="text"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="ឧ. កំពង់សោម"
                list="destinations-list"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
              />
              {settings?.destinations && (
                <datalist id="destinations-list">
                  {settings.destinations.map((d, idx) => (
                    <option key={idx} value={d} />
                  ))}
                </datalist>
              )}
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

            {/* Fuel/Liters */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-emerald-500" />
                ប្រេងផ្តល់ជូន/លីត្រ (Fuel/Liters) *
              </label>
              <input
                type="number"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="ឧ. 100"
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

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">កំណត់សម្គាល់ (Notes)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ព័ត៌មានបន្ថែមផ្សេងៗ..."
              rows={2}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none font-semibold"
            />
          </div>

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
              {departure ? 'រក្សាទុកការកែប្រែ (Save Changes)' : 'បង្កើតការចេញដំណើរ (Create Departure)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
