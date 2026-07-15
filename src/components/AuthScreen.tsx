import React, { useState } from 'react';
import { UserRole } from '../types';
import { Truck, Lock, User } from 'lucide-react';

interface AuthScreenProps {
  userRoles: UserRole[];
  onLoginCustom: (role: UserRole) => void;
  onRegisterCustom?: (role: UserRole) => Promise<void>;
}

export default function AuthScreen({
  userRoles,
  onLoginCustom,
  onRegisterCustom,
}: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleCustomRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const uName = regUsername.trim().toLowerCase();
    const uFullName = regFullName.trim();
    const uPass = regPassword.trim();
    const uConfirm = regConfirmPassword.trim();

    if (!uName || !uFullName || !uPass || !uConfirm) {
      setLoginError('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់! (Please fill in all fields!)');
      return;
    }

    if (uName === 'admin') {
      setLoginError('មិនអាចប្រើឈ្មោះគណនី "admin" បានទេ! (Cannot use "admin" as username!)');
      return;
    }

    if (uPass.length < 3) {
      setLoginError('ពាក្យសំងាត់ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរ! (Password must be at least 3 characters!)');
      return;
    }

    if (uPass !== uConfirm) {
      setLoginError('ពាក្យសំងាត់ទាំងពីរមិនដូចគ្នាទេ! (Passwords do not match!)');
      return;
    }

    // Check duplicate
    const exists = userRoles.some(r => r.email.trim().toLowerCase() === uName);
    if (exists) {
      setLoginError('ឈ្មោះគណនី ឬអ៊ីមែលនេះមានរួចហើយ! (This username/email is already registered!)');
      return;
    }

    const newRole: UserRole = {
      email: regUsername.trim(),
      name: uFullName,
      role: 'Standard',
      password: uPass,
    };

    setLoading(false);
    if (onRegisterCustom) {
      setLoading(true);
      try {
        await onRegisterCustom(newRole);
        onLoginCustom(newRole);
      } catch (err: any) {
        setLoginError(err.message || 'ការចុះឈ្មោះមិនបានសម្រេច! (Registration failed!)');
      } finally {
        setLoading(false);
      }
    } else {
      onLoginCustom(newRole);
    }
  };

  return (
    <div id="auth-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center animate-bounce">
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
        <div className="bg-white py-6 px-4 shadow-xl shadow-slate-100 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-100 mb-6 pb-1">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              ចូលប្រើប្រាស់ (Sign In)
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
              }}
              className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              ចុះឈ្មោះគណនី (Sign Up)
            </button>
          </div>

          {loginError && (
            <div className="rounded-lg bg-red-50 p-3.5 border border-red-100 text-xs text-red-700 font-semibold leading-relaxed mb-4">
              {loginError}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleCustomLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  ឈ្មោះគណនី / អ៊ីមែល (Username / Email)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    required
                    placeholder="e.g. driver1, csialexpress03@gmail.com"
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
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>ចូលប្រើប្រាស់ (Log In)</span>
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleCustomRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  ឈ្មោះគណនី / អ៊ីមែល (Username / Email)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. csialexpress03@gmail.com"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-mono font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  ឈ្មោះពេញរបស់អ្នកប្រើប្រាស់ (Full Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. សុខ ផានិត (Sokh Phanit)"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-semibold text-slate-800 placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * គណនីថ្មីនឹងទទួលបានសិទ្ធិ Standard (សិទ្ធិមើលជើងឡាន និងកក់ទំនិញ)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                  ពាក្យសំងាត់ (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="យ៉ាងហោចណាស់ ៣ តួ"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-mono font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                  បញ្ជាក់ពាក្យសំងាត់ (Confirm Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="បញ្ជាក់ពាក្យសំងាត់ម្តងទៀត"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-rose-500 font-mono font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>កំពុងចុះឈ្មោះ... (Registering...)</span>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>ចុះឈ្មោះ និងចូលប្រើប្រាស់ (Register & Log In)</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
