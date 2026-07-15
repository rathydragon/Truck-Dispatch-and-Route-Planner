import React, { useState, useMemo, useEffect } from 'react';
import { CargoBooking, UserRole, AppSettings } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Mail, 
  FileText, 
  Check, 
  Shield, 
  Globe,
  Camera,
  Loader2
} from 'lucide-react';
import { uploadFileToDrive } from '../lib/driveSheets';

interface BookingListProps {
  bookings: CargoBooking[];
  userRoles: UserRole[];
  settings?: AppSettings;
  onAddBooking: (bookingData: { 
    locationName: string; 
    phoneNumber: string; 
    zone: string; 
    userName: string; 
    linkLocation?: string;
  }) => void;
  onUpdateBookingStatus: (id: string, status: CargoBooking['status'], photoUrl?: string) => void;
  onDeleteBooking: (id: string) => void;
  canManage: boolean;
  currentUserEmail: string;
  token: string | null;
}

export default function BookingList({
  bookings,
  userRoles = [],
  settings,
  onAddBooking,
  onUpdateBookingStatus,
  onDeleteBooking,
  canManage,
  currentUserEmail,
  token,
}: BookingListProps) {
  const zones = settings?.zones || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [locationName, setLocationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [zone, setZone] = useState('');
  const [userName, setUserName] = useState('');
  const [linkLocation, setLinkLocation] = useState('');

  // Find current user's role and matching name
  const matchedUserRole = useMemo(() => {
    if (!currentUserEmail) return null;
    return userRoles.find((r) => r.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase());
  }, [userRoles, currentUserEmail]);

  const isUserAdmin = userRoles.length === 0 || matchedUserRole?.role?.toLowerCase() === 'admin';

  // Completion photo upload states
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelCompletion = () => {
    setCompletingBookingId(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setIsUploadingPhoto(false);
    setUploadError(null);
  };

  const handleConfirmCompletion = async () => {
    if (!completingBookingId) return;
    if (!photoFile) {
      setUploadError('សូមថតរូបភាព ឬជ្រើសរើសរូបភាពសិន! (Please capture or choose a photo first!)');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      let finalPhotoUrl = '';
      if (token) {
        // Upload to Google Drive!
        finalPhotoUrl = await uploadFileToDrive(token, photoFile);
      } else {
        // If no token, fallback to storing local base64 so they don't get blocked
        finalPhotoUrl = photoPreview;
      }
      
      onUpdateBookingStatus(completingBookingId, 'Completed', finalPhotoUrl);
      handleCancelCompletion();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'ការផ្ទុករូបភាពឡើងបរាជ័យ (Failed to upload photo).');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Set default name based on user role when adding is opened
  useEffect(() => {
    if (isAdding) {
      if (matchedUserRole) {
        setUserName(matchedUserRole.name);
      } else {
        setUserName('');
      }
    }
  }, [isAdding, matchedUserRole]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !phoneNumber.trim() || !zone.trim() || !userName.trim()) return;

    onAddBooking({
      locationName: locationName.trim(),
      phoneNumber: phoneNumber.trim(),
      zone: zone.trim(),
      userName: userName.trim(),
      linkLocation: linkLocation.trim(),
    });

    // Reset form
    setLocationName('');
    setPhoneNumber('');
    setZone('');
    setUserName('');
    setLinkLocation('');
    setIsAdding(false);
  };

  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return '-';
    try {
      const date = new Date(dtStr);
      return date.toLocaleString('km-KH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Phnom_Penh',
      });
    } catch (e) {
      return dtStr;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-left font-sans">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ស្វែងរកតាម ទីតាំង លេខទូរស័ព្ទ តំបន់ ឈ្មោះ..."
                  className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer font-semibold"
                >
                  <option value="All">ស្ថានភាពទាំងអស់ (All Status)</option>
                  <option value="Pending">កំពុងរង់ចាំ (Pending)</option>
                  <option value="Approved">បានអនុម័ត (Approved)</option>
                  <option value="Completed">បានបញ្ចប់ (Completed)</option>
                  <option value="Cancelled">បានលុបចោល (Cancelled)</option>
                </select>
                <Filter className="absolute right-3 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Add Booking Button */}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              {isAdding ? 'បិទការបង្កើត' : 'កក់អីវ៉ាន់ថ្មី (New Booking)'}
            </button>
          </div>

          {/* Add Booking Form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4 animate-slide-in">
              <div className="border-b border-slate-100 pb-2 mb-2">
                <h3 className="font-bold text-sm text-slate-800">កក់អីវ៉ាន់ មានជួលឈរ (Cargo Space Booking Form)</h3>
                <p className="text-[10px] text-slate-500">សូមបំពេញព័ត៌មានខាងក្រោមដើម្បីកក់ ឬជួលកន្លែងដាក់ឥវ៉ាន់របស់អ្នក</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    ឈ្មោះទីតាំង (Location Name) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. ឃ្លាំងភ្នំពេញថ្មី"
                      className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>


                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    លេខទូរស័ព្ទ (Phone Number) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 012345678"
                      className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    តំបន់ (Zone / Area) <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="e.g. ភ្នំពេញ (Phnom Penh)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                    {zones.length > 0 && (
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setZone(e.target.value);
                              e.target.value = ''; // Reset select choice
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none font-bold"
                        >
                          <option value="">⚡️ ជ្រើសរើសតំបន់ពីការកំណត់ប្រព័ន្ធ (Select from Configured Zones)</option>
                          {zones.map((z, idx) => (
                            <option key={idx} value={z}>
                              {z}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="វាយបញ្ចូលឈ្មោះដោយផ្ទាល់..."
                        className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                      />
                      {matchedUserRole && (
                        <span className="absolute right-2 top-1.5 text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5 text-blue-600" />
                          {matchedUserRole.role}
                        </span>
                      )}
                    </div>

                    {userRoles.length > 0 && (
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setUserName(e.target.value);
                              e.target.value = ''; // Reset select choice
                            }
                          }}
                          className="w-full px-2.5 py-1.5 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none font-bold"
                        >
                          <option value="">⚡️ ជ្រើសរើសទាញយកឈ្មោះពីសិទ្ធិអ្នកប្រើប្រាស់ (Select from User Roles)</option>
                          {userRoles.map((role, idx) => (
                            <option key={idx} value={role.name}>
                              {role.name} ({role.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    ជួលឈរ ឈ្មោះ(Link Location)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={linkLocation}
                      onChange={(e) => setLinkLocation(e.target.value)}
                      placeholder="e.g. ជួលឈរ ឬតំណភ្ជាប់ទីតាំង"
                      className="w-full pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  កក់ឥឡូវនេះ (Book Now)
                </button>
              </div>
            </form>
          )}

          {/* Bookings Table / Cards */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-sans">
                  <tr>
                    <th className="py-3 px-4">លេខរៀង (ID)</th>
                    <th className="py-3 px-4">ឈ្មោះទីតាំង (Location)</th>
                    <th className="py-3 px-4">លេខទូរស័ព្ទ (Phone)</th>
                    <th className="py-3 px-4">តំបន់ (Zone)</th>
                    <th className="py-3 px-4">ឈ្មោះអ្នកប្រើប្រាស់ (User)</th>
                    <th className="py-3 px-4">ថ្ងៃបង្កើត (Created Date)</th>
                    <th className="py-3 px-4">អីមែលអ្នកបង្កើត (Creator Email)</th>
                    <th className="py-3 px-4">ស្ថានភាព (Status)</th>
                    <th className="py-3 px-4 text-right">សកម្មភាព (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => {
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">#{b.id}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span>{b.locationName}</span>
                              {b.linkLocation && (
                                <a
                                  href={b.linkLocation.startsWith('http') ? b.linkLocation : b.linkLocation.includes('.') ? `https://${b.linkLocation}` : undefined}
                                  target={b.linkLocation.includes('.') ? '_blank' : undefined}
                                  rel={b.linkLocation.includes('.') ? 'noopener noreferrer' : undefined}
                                  className={`self-start inline-flex items-center gap-1 mt-1 text-[10px] font-bold transition-colors ${
                                    b.linkLocation.includes('.') ? 'text-emerald-600 hover:text-emerald-700 cursor-pointer' : 'text-slate-500'
                                  }`}
                                >
                                  <Globe className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                  ជួលឈរ៖ {b.linkLocation}
                                </a>
                              )}

                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {b.phoneNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              {b.zone}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{b.userName}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {formatDateTime(b.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {b.creatorEmail}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                b.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : b.status === 'Approved'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : b.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {b.status === 'Completed' ? 'បានបញ្ចប់' : b.status === 'Approved' ? 'បានអនុម័ត' : b.status === 'Cancelled' ? 'បានលុបចោល' : 'រង់ចាំអនុម័ត'}
                              </span>
                              {b.status === 'Completed' && b.photoUrl && (
                                <a
                                  href={b.photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] bg-slate-50 border border-slate-200 text-blue-600 hover:text-blue-800 rounded px-1 py-0.5 mt-0.5 font-bold transition-all cursor-pointer"
                                  title="មើលរូបភាពបញ្ចប់ (View Completion Photo)"
                                >
                                  <Camera className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                  <span>រូបភាពបញ្ចប់</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1">


                              {/* Status update buttons */}
                              {isUserAdmin && b.status === 'Pending' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(b.id, 'Approved')}
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded transition-all cursor-pointer"
                                  title="អនុម័តការកក់"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canManage && b.status === 'Approved' && (
                                <button
                                  onClick={() => setCompletingBookingId(b.id)}
                                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 rounded transition-all cursor-pointer"
                                  title="បញ្ចប់ការជួល/កក់ (ថតរូបភាព)"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canManage && (b.status === 'Pending' || b.status === 'Approved') && (
                                <button
                                  onClick={() => onUpdateBookingStatus(b.id, 'Cancelled')}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded transition-all cursor-pointer"
                                  title="លុបចោលការកក់"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {/* Delete Booking if standard user created it or admin */}
                              {(canManage || b.creatorEmail.toLowerCase() === currentUserEmail.toLowerCase()) && (
                                <button
                                  onClick={() => {
                                    if (confirm('តើអ្នកប្រាកដជាចង់លុបការកក់នេះទេ? (Are you sure you want to delete this booking?)')) {
                                      onDeleteBooking(b.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-all cursor-pointer"
                                  title="លុបគណនីការកក់"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        មិនមានទិន្នន័យការកក់ទេ (No cargo bookings found)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  return (
                    <div key={b.id} className="p-4 space-y-3 hover:bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{b.id}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{b.locationName}</h4>
                          {b.status === 'Completed' && b.photoUrl && (
                            <a
                              href={b.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-blue-600 hover:text-blue-800 rounded px-1.5 py-0.5 mt-1 font-bold transition-all cursor-pointer"
                              title="មើលរូបភាពបញ្ចប់ (View Completion Photo)"
                            >
                              <Camera className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                              <span>រូបភាពបញ្ចប់ (View Photo)</span>
                            </a>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : b.status === 'Approved'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : b.status === 'Cancelled'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {b.status === 'Completed' ? 'បានបញ្ចប់' : b.status === 'Approved' ? 'បានអនុម័ត' : b.status === 'Cancelled' ? 'បានលុបចោល' : 'រង់ចាំអនុម័ត'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">លេខទូរស័ព្ទ (Phone)</span>
                          <span className="font-mono text-slate-700">{b.phoneNumber}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">តំបន់ (Zone)</span>
                          <span className="text-slate-700">{b.zone}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">ឈ្មោះអ្នកប្រើប្រាស់ (User)</span>
                          <span className="font-bold text-slate-800">{b.userName}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">កាលបរិច្ឆេទ (Created)</span>
                          <span className="text-slate-500 text-[10px]">{formatDateTime(b.createdAt)}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-mono text-slate-400">{b.creatorEmail}</span>
                        </div>
                        <div className="flex gap-1">
                          {isUserAdmin && b.status === 'Pending' && (
                            <button
                              onClick={() => onUpdateBookingStatus(b.id, 'Approved')}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              អនុម័ត
                            </button>
                          )}
                          {canManage && b.status === 'Approved' && (
                            <button
                              onClick={() => setCompletingBookingId(b.id)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              បញ្ចប់
                            </button>
                          )}
                          {canManage && (b.status === 'Pending' || b.status === 'Approved') && (
                            <button
                              onClick={() => onUpdateBookingStatus(b.id, 'Cancelled')}
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              លុបចោល
                            </button>
                          )}
                          {(canManage || b.creatorEmail.toLowerCase() === currentUserEmail.toLowerCase()) && (
                            <button
                              onClick={() => {
                                if (confirm('តើអ្នកប្រាកដជាចង់លុបការកក់នេះទេ?')) {
                                  onDeleteBooking(b.id);
                                }
                              }}
                              className="bg-slate-50 text-slate-400 hover:text-red-500 px-2 py-1 rounded text-[10px] font-bold cursor-pointer border border-slate-200"
                            >
                              លុប
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  មិនមានទិន្នន័យការកក់ទេ (No cargo bookings found)
                </div>
              )}
            </div>
          </div>

          {/* Completion Photo Upload Modal */}
          {completingBookingId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">បញ្ចប់ការកក់អីវ៉ាន់</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Complete Cargo Booking</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelCompletion}
                    disabled={isUploadingPhoto}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-amber-800 text-[11px] font-semibold leading-relaxed">
                    ⚠️ រាល់ការបញ្ចប់ការដឹកជញ្ជូន ឬការជួលកក់ទាំងអស់ ត្រូវតែថតរូបភាពជាក់ស្តែងជាភស្តុតាងដើម្បីបញ្ចប់។
                    (All booking completions must include a photo proof of completion.)
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                      រូបភាពភស្តុតាងបញ្ចប់ (Proof Photo)
                    </label>

                    {photoPreview ? (
                      <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center group h-56">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <label className="bg-white text-slate-800 font-bold text-xs px-3 py-1.5 rounded-lg shadow cursor-pointer hover:bg-slate-50 transition-transform">
                            ប្តូររូបភាព (Change Photo)
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              onChange={handlePhotoChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50/50 hover:border-blue-500 transition-all cursor-pointer bg-slate-50/30 group h-56">
                        <div className="p-3 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-blue-500 transition-all">
                          <Camera className="h-6 w-6" />
                        </div>
                        <span className="mt-3 font-bold text-slate-700 text-xs text-center">ចុចទីនេះដើម្បីថតរូប ឬជ្រើសរើសរូបភាព</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1">Tap to capture or choose photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handlePhotoChange} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>

                  {uploadError && (
                    <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg p-2.5">
                      {uploadError}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancelCompletion}
                    disabled={isUploadingPhoto}
                    className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCompletion}
                    disabled={isUploadingPhoto || !photoFile}
                    className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>កំពុងរក្សាទុក...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>រក្សាទុក (Save & Complete)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
}
