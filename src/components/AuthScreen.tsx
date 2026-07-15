import React, { useState } from 'react';
import { UserRole } from '../types';
import { Truck, Lock, User } from 'lucide-react';

interface AuthScreenProps {
  userRoles: UserRole[];
  onLoginCustom: (role: UserRole) => void;
}

export default function AuthScreen({
  userRoles,
  onLoginCustom,
}: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

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

  return (
    <div id="auth-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-100">
            <Truck className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-sans">
          ប្រព័ន្ធគ្រប់គ្រងជើងឡាន
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

        </div>
      </div>
    </div>
  );
}
