import React, { useState } from 'react';
import { Sliders, Truck, User, MapPin, DollarSign, Fuel, Plus, Trash2, RotateCcw, Map, FileSpreadsheet, CloudLightning } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
  spreadsheetUrl?: string | null;
  onForcePushAll?: () => void;
}

export default function SettingsTab({
  settings,
  onUpdateSettings,
  onResetSettings,
  spreadsheetUrl,
  onForcePushAll,
}: SettingsTabProps) {
  // Local input states for adding items
  const [newPlate, setNewPlate] = useState('');
  const [newDriver, setNewDriver] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newCommission, setNewCommission] = useState<number | ''>('');
  const [newFuel, setNewFuel] = useState<number | ''>('');
  const [newZone, setNewZone] = useState('');

  const handleAddItem = (category: keyof AppSettings, value: string | number) => {
    if (value === '' || value === undefined) return;

    if (category === 'commissions' || category === 'fuelAmounts') {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) return;
      const currentList = (settings[category] || []) as number[];
      if (currentList.includes(numVal)) return; // Prevent duplicates
      const updatedList = [...currentList, numVal].sort((a, b) => a - b);
      onUpdateSettings({
        ...settings,
        [category]: updatedList,
      });
    } else {
      const strVal = String(value).trim();
      if (!strVal) return;
      const currentList = (settings[category] || []) as string[];
      if (currentList.some(item => String(item).toLowerCase() === strVal.toLowerCase())) return; // Prevent duplicates
      const updatedList = [...currentList, strVal];
      onUpdateSettings({
        ...settings,
        [category]: updatedList,
      });
    }
  };

  const handleRemoveItem = (category: keyof AppSettings, index: number) => {
    const currentList = (settings[category] || []) as any[];
    const updatedList = currentList.filter((_, i) => i !== index);
    onUpdateSettings({
      ...settings,
      [category]: updatedList,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header section */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-sans">
            <Sliders className="h-5 w-5 text-blue-600" />
            ការកំណត់ប្រព័ន្ធ (System Configurations)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            កំណត់ជម្រើសលំនាំដើមសម្រាប់ការបំពេញទម្រង់ផ្សេងៗ ដើម្បីភាពរហ័ស និងត្រឹមត្រូវ។ (Configure presets to speed up form entry and maintain data consistency.)
          </p>
        </div>
        <button
          onClick={onResetSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          title="កំណត់ឡើងវិញជាតម្លៃដើម (Reset to defaults)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          តម្លៃដើមវិញ (Reset Defaults)
        </button>
      </div>

      {/* Spreadsheet link section for mobile & backup */}
      {spreadsheetUrl && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                តំណភ្ជាប់ទិន្នន័យ (Google Sheets Link)
              </h4>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium leading-relaxed">
                រាល់ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុក និងធ្វើសមកាលកម្មស្វ័យប្រវត្តិជាមួយ Google Sheet របស់អ្នក។ (All data is synced and stored securely in your personal Google Sheet.)
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            {onForcePushAll && (
              <button
                onClick={onForcePushAll}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer justify-center"
                title="បញ្ជូនទិន្នន័យពីទូរស័ព្ទ/កុំព្យូទ័រទៅ Google Drive ឡើងវិញ (Overwrites Google Sheets with local data)"
              >
                <CloudLightning className="h-4 w-4" />
                <span>បញ្ជូនទិន្នន័យទៅ Drive ឡើងវិញ (Force Push All)</span>
              </button>
            )}
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer justify-center"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>បើក Google Sheets (Open Sheet)</span>
            </a>
          </div>
        </div>
      )}

      {/* Bento-like Grid of Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Plate Numbers */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <Truck className="h-4 w-4 text-blue-500" />
            ស្លាកលេខឡាន (Plate Numbers)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPlate.trim()) {
                  handleAddItem('plateNumbers', newPlate.toUpperCase());
                  setNewPlate('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="ឧ. 3A-9999"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {settings.plateNumbers.length > 0 ? (
                settings.plateNumbers.map((plate, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-mono font-bold text-slate-800 text-xs">{plate}</span>
                    <button
                      onClick={() => handleRemoveItem('plateNumbers', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Driver Names */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <User className="h-4 w-4 text-emerald-500" />
            ឈ្មោះអ្នកបើកបរ (Drivers)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newDriver.trim()) {
                  handleAddItem('driverNames', newDriver);
                  setNewDriver('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="ឧ. សុខ ជា"
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {settings.driverNames.length > 0 ? (
                settings.driverNames.map((driver, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-bold text-slate-800 text-xs">{driver}</span>
                    <button
                      onClick={() => handleRemoveItem('driverNames', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Destinations */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-rose-500" />
            គោលដៅដឹកជញ្ជូន (Destinations)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newDest.trim()) {
                  handleAddItem('destinations', newDest);
                  setNewDest('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="ឧ. កំពង់សោម"
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {settings.destinations.length > 0 ? (
                settings.destinations.map((dest, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-bold text-slate-800 text-xs">{dest}</span>
                    <button
                      onClick={() => handleRemoveItem('destinations', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Commissions */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <DollarSign className="h-4 w-4 text-amber-500" />
            កម្រៃជើងសារ (Commissions / USD)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCommission !== '' && !isNaN(Number(newCommission))) {
                  handleAddItem('commissions', Number(newCommission));
                  setNewCommission('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="number"
                placeholder="ឧ. 50"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value === '' ? '' : Number(e.target.value))}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {settings.commissions.length > 0 ? (
                settings.commissions.map((comm, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-bold text-slate-800 text-xs">${comm}</span>
                    <button
                      onClick={() => handleRemoveItem('commissions', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Fuel Amounts */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <Fuel className="h-4 w-4 text-purple-500" />
            ចំនួនប្រេងសាំង (Fuel / Liters)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newFuel !== '' && !isNaN(Number(newFuel))) {
                  handleAddItem('fuelAmounts', Number(newFuel));
                  setNewFuel('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="number"
                placeholder="ឧ. 100"
                value={newFuel}
                onChange={(e) => setNewFuel(e.target.value === '' ? '' : Number(e.target.value))}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {settings.fuelAmounts.length > 0 ? (
                settings.fuelAmounts.map((fuel, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-bold text-slate-800 text-xs font-mono">{fuel} លីត្រ (L)</span>
                    <button
                      onClick={() => handleRemoveItem('fuelAmounts', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Zones / Areas */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px]">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <Map className="h-4 w-4 text-sky-500" />
            តំបន់ / តំបន់គ្រប់គ្រង (Zones / Areas)
          </div>
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-hidden">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newZone.trim()) {
                  handleAddItem('zones', newZone.trim());
                  setNewZone('');
                }
              }}
              className="flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="ឧ. ភ្នំពេញ (Phnom Penh)"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                title="បន្ថែម"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50 space-y-1.5">
              {(settings.zones || []).length > 0 ? (
                (settings.zones || []).map((zone, index) => (
                  <div key={index} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-xs hover:border-slate-300 transition-colors">
                    <span className="font-bold text-slate-800 text-xs">{zone}</span>
                    <button
                      onClick={() => handleRemoveItem('zones', index)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400 font-medium">គ្មានទិន្នន័យ (Empty)</div>
              )}
            </div>
          </div>
        </div>

        {/* User permissions & roles are now configured in the dedicated "Permissions" tab */}

      </div>
    </div>
  );
}
