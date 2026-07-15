import React, { useState } from 'react';
import { googleSignIn } from '../lib/firebase';
import { UserRole } from '../types';
import { Truck, ShieldCheck, Database, AlertTriangle, ExternalLink, Copy, Check, Lock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthScreenProps {
  userRoles: UserRole[];
  onLoginCustom: (role: UserRole) => void;
  onLoginSuccess: (user: any, token: string) => void;
  googleUser: any;
}

export default function AuthScreen({
  userRoles,
  onLoginCustom,
  onLoginSuccess,
  googleUser,
}: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Google Sign-In states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnauthorizedError, setIsUnauthorizedError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [showGoogleLink, setShowGoogleLink] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const uName = username.trim().toLowerCase();
    const uPass = password.trim();

    if (!uName || !uPass) {
      setLoginError('សូមបំពេញឈ្មោះគណនី និងពាក្យសំងាត់! (Please enter username and password!)');
      return;
    }

    // Super admin fallback (always allowed)
    if (uName === 'admin' && uPass === 'admin') {
      onLoginCustom({
        email: 'admin',
        name: 'អ្នកគ្រប់គ្រង (Admin)',
        role: 'Admin',
        password: 'admin',
      });
      return;
    }

    // Default admin / admin if there are no roles configured yet
    if (userRoles.length === 0) {
      setLoginError(
        'មិនទាន់មានគណនីក្នុងប្រព័ន្ធឡើយ។ សូមប្រើ ឈ្មោះ៖ "admin" និង ពាក្យសំងាត់៖ "admin" ដើម្បីចូលប្រើលើកដំបូង។ (No accounts found. Use admin/admin to log in.)'
      );
      return;
    }

    const foundRole = userRoles.find((r) => r.email.trim().toLowerCase() === uName);

    if (!foundRole) {
      setLoginError('ឈ្មោះគណនី ឬអ៊ីមែល មិនត្រឹមត្រូវទេ! (Incorrect Username or Email!)');
      return;
    }

    const correctPassword = foundRole.password || 'admin'; // fallback to admin if undefined
    if (correctPassword !== uPass) {
      setLoginError('ពាក្យសំងាត់មិនត្រឹមត្រូវទេ! (Incorrect Password!)');
      return;
    }

    onLoginCustom(foundRole);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorizedError(false);
    try {
      const result = await googleSignIn();
      if (result) {
        onLoginSuccess(result.user, result.accessToken);
        alert('បានភ្ជាប់គណនី Google Sheets ដោយជោគជ័យ! (Google Sheets connected successfully!)');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || err?.code || String(err);
      setError(`មិនអាចចូលប្រើប្រាស់បានទេ! សូមព្យាយាមម្តងទៀត។ (Sign-in failed: ${msg})`);
      if (msg.includes('unauthorized-domain') || String(err).includes('unauthorized-domain')) {
        setIsUnauthorizedError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100">
            <Truck className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-sans">
          ប្រព័ន្ធគ្រប់គ្រងការចេញដំណើរឡាន
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          Truck Dispatch & Route Planner
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Main Credentials Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-6">
            <div className="text-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                ចូលប្រើប្រាស់កម្មវិធី (Sign In)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសំងាត់របស់អ្នក (Please enter your username and password)
              </p>
            </div>

            {loginError && (
              <div className="rounded-lg bg-red-50 p-3.5 border border-red-100 text-xs text-red-700 font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                ឈ្មោះគណនី / អ៊ីមែល (Username / Email)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. driver1, admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-mono font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-slate-400" />
                ពាក្យសំងាត់ (Password)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="password"
                  required
                  placeholder="e.g. ••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-mono font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>ចូលប្រើប្រាស់ (Log In)</span>
            </button>
          </form>

          {/* Google Sheet Sync Collapsible Settings (Admin Only) */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowGoogleLink(!showGoogleLink)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-indigo-500" />
                ការភ្ជាប់ Google Sheets (Google Sheet Sync)
              </span>
              {showGoogleLink ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showGoogleLink && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs animate-fade-in">
                <p className="leading-relaxed font-semibold text-slate-600">
                  {googleUser ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      បានភ្ជាប់ជា៖ {googleUser.email} (Connected as: {googleUser.email})
                    </span>
                  ) : (
                    'សម្រាប់ Admin៖ ភ្ជាប់គណនី Google ដើម្បីរក្សាទិន្នន័យស្វ័យប្រវត្តិទៅកាន់ Google Sheet របស់អ្នក។ (For Admins: Connect Google Account to automatically save data to your Google Sheets.)'
                  )}
                </p>

                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-slate-50 text-xs font-bold text-gray-700 transition-all duration-200 focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  {loading ? 'កំពុងតភ្ជាប់...' : 'ភ្ជាប់ជាមួយ Google (Admin)'}
                </button>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 border border-red-100 text-[11px] text-red-700 font-semibold text-center">
                    {error}
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
      </div>
    </div>
  );
}
