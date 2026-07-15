import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Mail, User, Shield, UserCheck, Edit, X } from 'lucide-react';
import { AppSettings, UserRole } from '../types';

interface PermissionsTabProps {
  userRoles: UserRole[];
  onUpdateUserRoles: (newRoles: UserRole[]) => void;
  settings: AppSettings;
}

export default function PermissionsTab({
  userRoles,
  onUpdateUserRoles,
  settings,
}: PermissionsTabProps) {
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleType, setNewRoleType] = useState<'Admin' | 'Standard'>('Standard');
  const [newRoleDriver, setNewRoleDriver] = useState('');
  const [newRolePassword, setNewRolePassword] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newRoleEmail.trim().toLowerCase();
    const name = newRoleName.trim();
    if (!email || !name) return;

    if (editingEmail) {
      // Editing existing permission
      if (email !== editingEmail.toLowerCase() && userRoles.some((u) => u.email.toLowerCase() === email)) {
        alert('ឈ្មោះអ្នកប្រើប្រាស់/អ៊ីមែលនេះមានកំណត់សិទ្ធិរួចហើយ (This username/email already has configured permissions)');
        return;
      }

      const updatedRoles = userRoles.map((u) => {
        if (u.email.toLowerCase() === editingEmail.toLowerCase()) {
          return {
            email,
            name,
            role: newRoleType,
            assignedDriver: newRoleType === 'Standard' && newRoleDriver ? newRoleDriver : undefined,
            password: newRolePassword.trim(),
          };
        }
        return u;
      });

      onUpdateUserRoles(updatedRoles);
      setEditingEmail(null);
      setNewRoleEmail('');
      setNewRoleName('');
      setNewRoleType('Standard');
      setNewRoleDriver('');
      setNewRolePassword('');
    } else {
      // Adding new permission
      if (userRoles.some((u) => u.email.toLowerCase() === email)) {
        alert('ឈ្មោះអ្នកប្រើប្រាស់/អ៊ីមែលនេះមានកំណត់សិទ្ធិរួចហើយ (This username/email already has configured permissions)');
        return;
      }

      const newRole: UserRole = {
        email,
        name,
        role: newRoleType,
        assignedDriver: newRoleType === 'Standard' && newRoleDriver ? newRoleDriver : undefined,
        password: newRolePassword.trim(),
      };

      onUpdateUserRoles([...userRoles, newRole]);
      setNewRoleEmail('');
      setNewRoleName('');
      setNewRoleType('Standard');
      setNewRoleDriver('');
      setNewRolePassword('');
    }
  };

  const handleCancelEdit = () => {
    setEditingEmail(null);
    setNewRoleEmail('');
    setNewRoleName('');
    setNewRoleType('Standard');
    setNewRoleDriver('');
    setNewRolePassword('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header section */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-sans">
            <ShieldCheck className="h-5 w-5 text-rose-600" />
            ការគ្រប់គ្រងសិទ្ធិអ្នកប្រើប្រាស់ (User Permissions & Roles)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            កំណត់សិទ្ធិជាក់លាក់សម្រាប់គណនីនីមួយៗ ដោយផ្អែកលើអ៊ីមែល Google (Gmail) របស់ពួកគេ។ (Configure specific user roles based on their Google Gmail accounts.)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Add/Edit User Gmail Permission */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit lg:col-span-1">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <UserCheck className="h-4 w-4 text-blue-500" />
            {editingEmail ? 'កែប្រែសិទ្ធិអ្នកប្រើប្រាស់ (Edit Permission)' : 'បន្ថែមសិទ្ធិអ្នកប្រើថ្មី (Add New Permission)'}
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  ឈ្មោះគណនី / អ៊ីមែល (Username / Email)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. driver1, admin, rathy@gmail.com"
                  value={newRoleEmail}
                  onChange={(e) => setNewRoleEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 placeholder:text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  ពាក្យសំងាត់ (Password)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  value={newRolePassword}
                  onChange={(e) => setNewRolePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 placeholder:text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  ឈ្មោះអ្នកប្រើប្រាស់ (Full Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. សុខ ជា"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  សិទ្ធិចូលប្រើប្រាស់ (Role)
                </label>
                <select
                  value={newRoleType}
                  onChange={(e) => {
                    const role = e.target.value as 'Admin' | 'Standard';
                    setNewRoleType(role);
                    if (role === 'Admin') setNewRoleDriver('');
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
                >
                  <option value="Standard">Standard (អ្នកប្រើធម្មតា)</option>
                  <option value="Admin">Admin (អ្នកគ្រប់គ្រង)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                  <span>អ្នកបើកបរដែលត្រូវកំណត់ (Assigned Driver Restriction)</span>
                  {newRoleType !== 'Admin' && settings.driverNames.length > 0 && (
                    <div className="flex gap-2 font-semibold normal-case">
                      <button
                        type="button"
                        onClick={() => setNewRoleDriver(settings.driverNames.join(', '))}
                        className="text-blue-600 hover:text-blue-800 text-[10px] cursor-pointer"
                      >
                        ជ្រើសរើសទាំងអស់ (All)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setNewRoleDriver('')}
                        className="text-slate-500 hover:text-slate-700 text-[10px] cursor-pointer"
                      >
                        សម្អាត (Clear)
                      </button>
                    </div>
                  )}
                </label>
                
                {newRoleType === 'Admin' ? (
                  <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 italic">
                    គណនី Admin មិនត្រូវការកំណត់សិទ្ធិអ្នកបើកបរទេ (Admin accounts have unrestricted access to all driver data)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {settings.driverNames.length === 0 ? (
                      <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 italic">
                        សូមកំណត់ឈ្មោះអ្នកបើកបរនៅក្នុង ការកំណត់ប្រព័ន្ធ ជាមុនសិន។ (Please add drivers in System Settings first.)
                      </div>
                    ) : (
                      <>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/50">
                          {settings.driverNames.map((driver, idx) => {
                            const isChecked = (newRoleDriver ? newRoleDriver.split(',').map(s => s.trim()) : []).includes(driver);
                            return (
                              <label key={idx} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded transition-colors cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const current = newRoleDriver ? newRoleDriver.split(',').map(s => s.trim()).filter(Boolean) : [];
                                    const updated = current.includes(driver)
                                      ? current.filter(d => d !== driver)
                                      : [...current, driver];
                                    setNewRoleDriver(updated.join(', '));
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className={`text-xs font-semibold ${isChecked ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                                  {driver}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {newRoleDriver ? (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/40 border border-blue-100 rounded-lg">
                            <span className="text-[10px] font-bold text-blue-700 w-full mb-0.5">អ្នកបើកបរដែលបានជ្រើសរើស ({newRoleDriver.split(',').filter(Boolean).length})៖</span>
                            {newRoleDriver.split(',').map(s => s.trim()).filter(Boolean).map((d, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-blue-200 text-blue-700 font-bold rounded-md text-[10px]">
                                {d}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = newRoleDriver.split(',').map(s => s.trim()).filter(Boolean);
                                    const updated = current.filter(name => name !== d);
                                    setNewRoleDriver(updated.join(', '));
                                  }}
                                  className="text-blue-400 hover:text-blue-600 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50/50 border border-emerald-100 p-2 rounded-lg">
                            <span>✓</span> ឃើញទិន្នន័យគ្រប់អ្នកបើកបរទាំងអស់ (All drivers visible)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                  * សិទ្ធិ Standard អាចកំណត់ឱ្យឃើញតែទិន្នន័យរបស់អ្នកបើកបរដែលបានជ្រើសរើសខាងលើនេះប៉ុណ្ណោះ។
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                {editingEmail && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    បោះបង់ (Cancel)
                  </button>
                )}
                <button
                  type="submit"
                  className={`${editingEmail ? 'flex-1' : 'w-full'} py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-50`}
                >
                  {editingEmail ? (
                    <>
                      <Shield className="h-4 w-4" />
                      រក្សាទុក (Save)
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      បន្ថែមសិទ្ធិ (Add)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List of Authorized Users */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit lg:col-span-2">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-xs text-slate-700 font-sans uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-500" />
              បញ្ជីគណនីមានសិទ្ធិចូលប្រើ (Authorized Accounts)
            </span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
              {userRoles.length} គណនី
            </span>
          </div>
          <div className="p-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">ឈ្មោះអ្នកប្រើ/អ៊ីមែល</th>
                    <th className="py-2.5 px-3">ឈ្មោះពិត</th>
                    <th className="py-2.5 px-3">ពាក្យសំងាត់</th>
                    <th className="py-2.5 px-3">សិទ្ធិចូលប្រើ</th>
                    <th className="py-2.5 px-3">អ្នកបើកបរដែលបានកំណត់</th>
                    <th className="py-2.5 px-3 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {userRoles.length > 0 ? (
                    userRoles.map((role, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">{role.email}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{role.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 font-bold">{role.password || <span className="text-slate-300 italic text-[10px]">គ្មាន (None)</span>}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            role.role === 'Admin' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {role.role === 'Admin' ? 'Admin' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {role.role === 'Admin' ? (
                            <span className="text-slate-400 font-medium text-[11px]">ឃើញគ្រប់យ៉ាង (All Data)</span>
                          ) : role.assignedDriver ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {role.assignedDriver.split(',').map((d, i) => (
                                <span key={i} className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px] font-sans">
                                  {d.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">ឃើញទាំងអស់ (Unassigned)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditingEmail(role.email);
                              setNewRoleEmail(role.email);
                              setNewRoleName(role.name);
                              setNewRoleType(role.role);
                              setNewRoleDriver(role.assignedDriver || '');
                              setNewRolePassword(role.password || '');
                            }}
                            className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer mr-1.5 inline-flex items-center"
                            title="កែប្រែសិទ្ធិ (Edit Permission)"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`តើអ្នកច្បាស់ទេថាចង់លុបសិទ្ធិចូលប្រើរបស់គណនី ${role.email}?`)) {
                                const updated = userRoles.filter((u) => u.email.toLowerCase() !== role.email.toLowerCase());
                                onUpdateUserRoles(updated);
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center"
                            title="លុបសិទ្ធិ (Delete Permission)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        មិនទាន់មានគណនីកំណត់សិទ្ធិទេ (No custom roles configured).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
              * <strong>ចំណាំ៖</strong> ប្រព័ន្ធនឹងតម្រូវឱ្យគណនី Gmail នីមួយៗត្រូវតែមានឈ្មោះក្នុងបញ្ជីខាងលើនេះ ទើបអាចចូលប្រើប្រាស់ប្រព័ន្ធបាន។ ប្រសិនបើបញ្ជីនេះនៅទទេរ គ្រប់គណនីដែលបាន Login នឹងទទួលបានសិទ្ធិជា Admin ដោយស្វ័យប្រវត្តិដើម្បីកុំឱ្យជាប់សោ (Lockout)។
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
