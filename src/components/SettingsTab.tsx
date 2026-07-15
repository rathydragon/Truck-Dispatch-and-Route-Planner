import React, { useState } from 'react';
import { 
  Sliders, 
  Truck, 
  User, 
  MapPin, 
  DollarSign, 
  Fuel, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Map, 
  FileSpreadsheet, 
  CloudLightning,
  Database,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  LogOut
} from 'lucide-react';
import { AppSettings } from '../types';
import { googleSignIn } from '../lib/firebase';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSettings: () => void;
  spreadsheetUrl?: string | null;
  onForcePushAll?: () => void;
  googleUser?: any;
  onGoogleSignInSuccess: (user: any, token: string) => void;
  onGoogleDisconnect: () => void;
}

export default function SettingsTab({
  settings,
  onUpdateSettings,
  onResetSettings,
  spreadsheetUrl,
  onForcePushAll,
  googleUser,
  onGoogleSignInSuccess,
  onGoogleDisconnect,
}: SettingsTabProps) {
  // Google Sign-In states in SettingsTab
  const [googleSignInError, setGoogleSignInError] = useState<string | null>(null);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [isUnauthorizedError, setIsUnauthorizedError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleSignInLoading(true);
    setGoogleSignInError(null);
    setIsUnauthorizedError(false);
    try {
      const result = await googleSignIn();
      if (result) {
        onGoogleSignInSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.code || String(err);
      setGoogleSignInError(`មិនអាចភ្ជាប់គណនីបានទេ! សូមព្យាយាមម្តងទៀត។ (Sign-in failed: ${msg})`);
      if (msg.includes('unauthorized-domain') || String(err).includes('unauthorized-domain')) {
        setIsUnauthorizedError(true);
      }
    } finally {
      setGoogleSignInLoading(false);
    }
  };

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

      {/* Default Super Admin Notice Banner */}
      <div className="bg-amber-50/70 border border-amber-150 rounded-xl p-4 flex gap-3 text-slate-800 animate-fade-in shadow-xs">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-sans">
            គណនីគ្រប់គ្រងជាន់ខ្ពស់លំនាំដើម (Default Super Admin Credentials)
          </p>
          <p className="text-[11px] leading-relaxed text-amber-900">
            អ្នកអាចប្រើប្រាស់គណនី ឈ្មោះ៖ <strong className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">admin</strong> និង ពាក្យសំងាត់៖ <strong className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">admin</strong> ដើម្បីចូលប្រើប្រាស់ជាអ្នកគ្រប់គ្រងជាន់ខ្ពស់ (Super Admin) ក្នុងករណីមិនទាន់មានគណនីផ្សេងទៀតត្រូវបានកំណត់សិទ្ធិ។ (Use <strong className="font-mono font-semibold text-amber-950">admin / admin</strong> to log in as default Admin.)
          </p>
        </div>
      </div>

      {/* Google Sheets Sync Integration Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <Database className="h-4 w-4 text-indigo-500" />
            ការភ្ជាប់ Google Sheets (Google Sheets Integration)
          </div>
          {googleUser && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              Active / បានភ្ជាប់
            </span>
          )}
        </div>
        <div className="p-4">
          {googleUser ? (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  បានភ្ជាប់គណនី Google (Google Account Connected)
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  អ៊ីមែល៖ <span className="font-semibold text-emerald-700">{googleUser.email}</span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                  រាល់ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុក និងធ្វើសមកាលកម្មស្វ័យប្រវត្តិជាមួយ Google Sheet របស់អ្នក។ (All data is synced and stored securely in your personal Google Sheet.)
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                {onForcePushAll && (
                  <button
                    onClick={onForcePushAll}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer justify-center"
                    title="បញ្ជូនទិន្នន័យពីទូរស័ព្ទ/កុំព្យូទ័រទៅ Google Drive ឡើងវិញ (Overwrites Google Sheets with local data)"
                  >
                    <CloudLightning className="h-4 w-4" />
                    <span>បញ្ជូនទិន្នន័យឡើងវិញ (Force Push All)</span>
                  </button>
                )}
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer justify-center"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>បើក Google Sheets (Open Sheet)</span>
                  </a>
                )}
                <button
                  onClick={onGoogleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer justify-center"
                  title="ផ្តាច់គណនី Google (Disconnect Google Account)"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>ផ្តាច់ការភ្ជាប់ (Disconnect)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-slate-400" />
                    មិនទាន់បានភ្ជាប់គណនី Google ឡើយ (Google Sheets Not Connected)
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                    ភ្ជាប់គណនី Google របស់អ្នកដើម្បីកត់ត្រា និងរក្សាទុកទិន្នន័យការចេញដំណើរស្វ័យប្រវត្តទៅក្នុង Google Sheet។ (Connect your Google Account to automatically record and sync all dispatch data to Google Sheets.)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleSignInLoading}
                  className="w-full md:w-auto flex items-center justify-center px-4 py-2.5 border border-indigo-200 rounded-xl shadow-sm bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all duration-200 focus:outline-none disabled:opacity-50 cursor-pointer gap-2"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="currentColor"
                    />
                  </svg>
                  {googleSignInLoading ? 'កំពុងតភ្ជាប់...' : 'ភ្ជាប់ជាមួយ Google (Admin)'}
                </button>
              </div>

              {googleSignInError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100 text-[11px] text-red-700 font-semibold text-center animate-fade-in">
                  {googleSignInError}
                </div>
              )}

              {isUnauthorizedError && (
                <div className="rounded-xl bg-amber-50/70 p-4 border border-amber-200 text-slate-800 space-y-3 text-[11px] animate-fade-in font-medium">
                  <div className="flex items-center gap-2 text-amber-850 font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>ការណែនាំដោះស្រាយ (How to Fix This Error)</span>
                  </div>

                  <p className="leading-relaxed">
                    ដែន (Domain) របស់កម្មវិធីនេះមិនទាន់ត្រូវបានអនុញ្ញាតក្នុង Firebase Console របស់អ្នកនៅឡើយទេ។ សូមបន្ថែមដែននេះទៅក្នុង Authorized domains របស់អ្នក៖
                  </p>

                  <div className="space-y-2">
                    {[
                      window.location.hostname,
                      'ais-dev-ah2hy73n6drdx2ojvqvdou-514551469382.asia-southeast1.run.app',
                      'ais-pre-ah2hy73n6drdx2ojvqvdou-514551469382.asia-southeast1.run.app'
                    ].filter((val, idx, self) => self.indexOf(val) === idx).map((domain) => (
                      <div key={domain} className="flex items-center gap-2">
                        <code className="font-mono bg-white px-2 py-1 rounded border border-slate-200 text-red-600 font-bold text-[10px] break-all flex-1 select-all">
                          {domain}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(domain);
                            setCopiedDomain(domain);
                            setTimeout(() => setCopiedDomain(null), 2000);
                          }}
                          className="p-1 hover:bg-slate-100 rounded border border-slate-200 bg-white cursor-pointer transition-colors"
                        >
                          {copiedDomain === domain ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-500" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
