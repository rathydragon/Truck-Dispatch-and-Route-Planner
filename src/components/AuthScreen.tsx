import React, { useState } from 'react';
import { googleSignIn } from '../lib/firebase';
import { Truck, ShieldCheck, Database, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnauthorizedError, setIsUnauthorizedError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorizedError(false);
    try {
      const result = await googleSignIn();
      if (result) {
        onLoginSuccess(result.user, result.accessToken);
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
    <div id="auth-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 sm:rounded-2xl sm:px-10 border border-slate-100">
          <div className="space-y-6">
            <div>
              <p className="text-center text-sm font-medium text-gray-700 mb-6">
                ដើម្បីរក្សាទុក និងគ្រប់គ្រងទិន្នន័យ សូមចូលប្រើប្រាស់គណនី Google របស់អ្នក
              </p>

              <button
                id="google-signin-btn"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white hover:bg-slate-50 text-sm font-medium text-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none">
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
                {loading ? 'កំពុងតភ្ជាប់...' : 'ចូលគណនីជាមួយ Google'}
              </button>
            </div>

            {error && (
              <div id="auth-error" className="rounded-lg bg-red-50 p-4 border border-red-100">
                <div className="text-sm text-red-700 font-medium text-center">{error}</div>
              </div>
            )}

            {isUnauthorizedError && (
              <div className="rounded-xl bg-amber-50/70 p-5 border border-amber-200 text-slate-800 space-y-4 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-amber-850 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>ការណែនាំដោះស្រាយ (How to Fix This Error)</span>
                </div>
                
                <p className="leading-relaxed font-semibold text-slate-700">
                  ដែន (Domain) របស់កម្មវិធីនេះមិនទាន់ត្រូវបានអនុញ្ញាតក្នុង Firebase Console របស់អ្នកនៅឡើយទេ។ សូមអនុវត្តតាមជំហានខាងក្រោម៖
                </p>

                <ol className="list-decimal list-inside space-y-3 font-semibold text-slate-700">
                  <li>
                    បើកទំព័រ <span className="font-bold text-indigo-600">Firebase Settings</span>៖
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0387607684/authentication/providers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm"
                    >
                      <span>បើក Firebase Console</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    ជ្រើសរើសផ្ទាំង <span className="font-bold">Settings</span> (ការកំណត់) រួចចុចលើ <span className="font-bold">Authorized domains</span> (ដែនដែលបានអនុញ្ញាត)។
                  </li>
                  <li>
                    ចុចប៊ូតុង <span className="font-bold text-indigo-600">Add domain</span> (បន្ថែមដែន) ហើយបន្ថែមឈ្មោះដែនទាំងនេះ៖
                    <div className="mt-2 space-y-2 pl-4">
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
                            title="ចម្លង (Copy)"
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
                  </li>
                  <li>
                    ចុច <span className="font-bold">Save</span> រួចត្រឡប់មកទីនេះ ហើយចុចប៊ូតុងចូលគណនីម្តងទៀត។
                  </li>
                </ol>
              </div>
            )}

            <div className="border-t border-slate-100 pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-700 block mb-0.5">រក្សាទុកក្នុង Google Sheets ផ្ទាល់ខ្លួន</strong>
                  រាល់ទិន្នន័យនៃការចេញដំណើរ និងជើងដឹកជញ្ជូនទាំងអស់ ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពនៅក្នុង Google Drive របស់អ្នកផ្ទាល់។
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-700 block mb-0.5">សុវត្ថិភាព និងឯកជនភាព</strong>
                  កម្មវិធីនេះប្រើប្រាស់តែឯកសារដែលវាបានបង្កើតផ្ទាល់ខ្លួនប៉ុណ្ណោះ ដោយមិនប៉ះពាល់ដល់ឯកសារផ្សេងទៀតឡើយ។
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
