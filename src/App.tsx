import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Departure, Trip, AppSettings, UserRole, CargoBooking, UserNotification } from './types';
import { initAuth, logoutUser, saveStateToFirestore, getStateFromFirestore } from './lib/firebase';
import { findOrCreateSpreadsheet, fetchSpreadsheetData, syncSpreadsheetData, syncUserRolesData, syncCargoBookingsData } from './lib/driveSheets';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import DepartureList from './components/DepartureList';
import TripList from './components/TripList';
import DepartureForm from './components/DepartureForm';
import TripForm from './components/TripForm';
import SettingsTab from './components/SettingsTab';
import BookingList from './components/BookingList';
import NotificationCenter from './components/NotificationCenter';
import PermissionsTab from './components/PermissionsTab';
import { 
  Truck, 
  Navigation, 
  LayoutDashboard, 
  LogOut, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  Sliders,
  Box,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

const getCambodiaISOString = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.format(date); // "YYYY-MM-DD HH:mm:ss"
  return `${parts.replace(' ', 'T')}+07:00`;
};

const getCambodiaDateTimeLocalString = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date).replace(' ', 'T');
};

export default function App() {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Phnom_Penh' });
  };

  // Auth state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_google_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('truck_dispatch_google_access_token');
    } catch {
      return null;
    }
  });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: 'Admin' | 'Standard' } | null>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // Data state
  const [departures, setDepartures] = useState<Departure[]>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_departures');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userRoles, setUserRoles] = useState<UserRole[]>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_user_roles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cargoBookings, setCargoBookings] = useState<CargoBooking[]>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_cargo_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('truck_dispatch_spreadsheet_id');
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('truck_dispatch_spreadsheet_url');
  });

  // App running states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'departures' | 'trips' | 'bookings' | 'settings' | 'permissions'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // System presets state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.zones) {
          parsed.zones = ['ភ្នំពេញ (Phnom Penh)', 'កំពង់សោម (Sihanoukville)', 'សៀមរាប (Siem Reap)', 'បាត់ដំបង (Battambang)', 'កំពត (Kampot)'];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved settings:', e);
    }
    return {
      plateNumbers: ['3A-4567', '3B-1234', '3C-8888', '2A-9999', '2B-7777'],
      driverNames: ['សុខ ជា', 'មាស ចាន់', 'កែវ វិសាល', 'ឡុង ដារ៉ា'],
      destinations: ['កំពង់សោម (Sihanoukville)', 'បាត់ដំបង (Battambang)', 'សៀមរាប (Siem Reap)', 'ប៉ោយប៉ែត (Poipet)', 'កំពត (Kampot)'],
      commissions: [20, 30, 40, 50, 60, 80, 100],
      fuelAmounts: [30, 50, 80, 100, 120, 150, 200],
      zones: ['ភ្នំពេញ (Phnom Penh)', 'កំពង់សោម (Sihanoukville)', 'សៀមរាប (Siem Reap)', 'បាត់ដំបង (Battambang)', 'កំពត (Kampot)']
    };
  });

  // Real-time synchronization states
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    try {
      const saved = localStorage.getItem('truck_dispatch_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse notifications:', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('truck_dispatch_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('truck_dispatch_departures', JSON.stringify(departures));
  }, [departures]);

  useEffect(() => {
    localStorage.setItem('truck_dispatch_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('truck_dispatch_user_roles', JSON.stringify(userRoles));
  }, [userRoles]);

  useEffect(() => {
    localStorage.setItem('truck_dispatch_cargo_bookings', JSON.stringify(cargoBookings));
  }, [cargoBookings]);

  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem('truck_dispatch_spreadsheet_id', spreadsheetId);
    } else {
      localStorage.removeItem('truck_dispatch_spreadsheet_id');
    }
  }, [spreadsheetId]);

  useEffect(() => {
    if (spreadsheetUrl) {
      localStorage.setItem('truck_dispatch_spreadsheet_url', spreadsheetUrl);
    } else {
      localStorage.removeItem('truck_dispatch_spreadsheet_url');
    }
  }, [spreadsheetUrl]);

  // Forms state
  const [showDepartureForm, setShowDepartureForm] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  
  const [showTripForm, setShowTripForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [dispatchingDeparture, setDispatchingDeparture] = useState<Departure | null>(null);

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'success' | 'info';
  } | null>(null);

  /**
   * Triggers the custom confirmation modal before critical mutations.
   */
  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'success' | 'info' = 'warning'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      type
    });
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('truck_dispatch_settings', JSON.stringify(newSettings));
    syncWithSheets(departures, trips, newSettings);
  };

  const handleResetSettings = () => {
    const defaultSettings: AppSettings = {
      plateNumbers: ['3A-4567', '3B-1234', '3C-8888', '2A-9999', '2B-7777'],
      driverNames: ['សុខ ជា', 'មាស ចាន់', 'កែវ វិសាល', 'ឡុង ដារ៉ា'],
      destinations: ['កំពង់សោម (Sihanoukville)', 'បាត់ដំបង (Battambang)', 'សៀមរាប (Siem Reap)', 'ប៉ោយប៉ែត (Poipet)', 'កំពត (Kampot)'],
      commissions: [20, 30, 40, 50, 60, 80, 100],
      fuelAmounts: [30, 50, 80, 100, 120, 150, 200],
      zones: ['ភ្នំពេញ (Phnom Penh)', 'កំពង់សោម (Sihanoukville)', 'សៀមរាប (Siem Reap)', 'បាត់ដំបង (Battambang)', 'កំពត (Kampot)']
    };
    askConfirmation(
      'កំណត់ការកំណត់ឡើងវិញ (Reset Configurations)',
      'តើអ្នកច្បាស់ទេថាចង់កំណត់តម្លៃទាំងអស់ឡើងវិញជាតម្លៃដើម? (Are you sure you want to reset all settings to defaults?)',
      () => {
        handleUpdateSettings(defaultSettings);
      },
      'warning'
    );
  };

  const handleForcePushAll = () => {
    if (!token || !spreadsheetId) return;
    askConfirmation(
      'បញ្ជូនទិន្នន័យទៅ Google Sheets (Force Sync to Google Sheets)',
      'តើអ្នកចង់បញ្ជូនទិន្នន័យបច្ចុប្បន្នទាំងអស់ពីកម្មវិធីទៅជំនួសនៅក្នុង Google Sheets មែនទេ? (Are you sure you want to overwrite all data in Google Sheets with the current app state?)',
      async () => {
        setSyncing(true);
        setSyncError(null);
        try {
          // 1. Sync Departures, Trips, Settings
          await syncSpreadsheetData(token, spreadsheetId, departures, trips, settings);
          // 2. Sync Cargo Bookings
          await syncCargoBookingsData(token, spreadsheetId, cargoBookings);
          // 3. Sync User Roles
          await syncUserRolesData(token, spreadsheetId, userRoles);
          
          setLastSyncedAt(new Date());
          
          askConfirmation(
            'ជោគជ័យ (Success)',
            'ទិន្នន័យទាំងអស់ត្រូវបានបញ្ជូន និងអាប់ដេតក្នុង Google Sheets រួចរាល់! (All data has been successfully pushed and updated in your Google Sheets!)',
            () => {},
            'success'
          );
        } catch (err: any) {
          console.error(err);
          if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
            setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
            handleAuthExpiry();
          } else {
            setSyncError('ការផ្ញើទិន្នន័យទៅ Drive មិនបានជោគជ័យ (Failed to sync with Google Sheets)');
          }
        } finally {
          setSyncing(false);
        }
      },
      'warning'
    );
  };

  const handleUpdateUserRoles = async (newRoles: UserRole[]) => {
    setUserRoles(newRoles);
    // Sync to cloud Firestore
    await saveStateToFirestore({ userRoles: newRoles });

    if (!token || !spreadsheetId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncUserRolesData(token, spreadsheetId, newRoles);
      console.log('User roles successfully updated and synced to Google Sheets.');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('មិនអាចរក្សាទុកព័ត៌មានសិទ្ធិអ្នកប្រើប្រាស់ទៅ Google Sheets បានទេ (Failed to sync user roles to Google Sheets)');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCargoBooking = async (bookingData: { locationName: string; phoneNumber: string; zone: string; userName: string; linkLocation?: string }) => {
    const nextIdNum = cargoBookings.length > 0 
      ? Math.max(...cargoBookings.map(b => {
          const match = b.id.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })) + 1
      : 1;
    const paddedId = String(nextIdNum).padStart(4, '0');
    const newId = `KB-${paddedId}`;

    const newBooking: CargoBooking = {
      id: newId,
      locationName: bookingData.locationName,
      phoneNumber: bookingData.phoneNumber,
      zone: bookingData.zone,
      userName: bookingData.userName,
      createdAt: getCambodiaISOString(new Date()),
      creatorEmail: currentUser?.email || 'anonymous',
      status: 'Pending',
      linkLocation: bookingData.linkLocation,
    };

    const updatedBookings = [newBooking, ...cargoBookings];
    setCargoBookings(updatedBookings);

    // Create a new notification for this user
    const newNotif: UserNotification = {
      id: `NT-${Date.now()}`,
      userName: bookingData.userName || 'Anonymous',
      title: 'ការកក់អីវ៉ាន់ថ្មី (New Cargo Booking)',
      message: `មានការកក់អីវ៉ាន់ថ្មីលេខ #${newId} សម្រាប់ ${bookingData.userName || 'អ្នកប្រើប្រាស់'} នៅតំបន់ ${bookingData.zone} ទីតាំង ${bookingData.locationName}។`,
      createdAt: getCambodiaISOString(new Date()),
      isRead: false,
      bookingId: newId,
      status: 'Pending',
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Save cargo bookings to cloud Firestore to synchronize across devices
    await saveStateToFirestore({ cargoBookings: updatedBookings });

    if (!token || !spreadsheetId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncCargoBookingsData(token, spreadsheetId, updatedBookings);
      console.log('Cargo booking successfully created and synced.');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('មិនអាចរក្សាទុកការកក់អីវ៉ាន់ទៅ Google Sheets បានទេ (Failed to sync cargo bookings)');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateCargoBookingStatus = async (id: string, status: CargoBooking['status'], photoUrl?: string) => {
    const updatedBookings = cargoBookings.map(b => b.id === id ? { ...b, status, ...(photoUrl ? { photoUrl } : {}) } : b);
    setCargoBookings(updatedBookings);

    // Find target booking to create state update notification
    const targetBooking = cargoBookings.find(b => b.id === id);
    if (targetBooking) {
      let title = '';
      let message = '';
      if (status === 'Approved') {
        title = 'បានទទួលការកក់អីវ៉ាន់ (Booking Received)';
        message = `ការកក់អីវ៉ាន់លេខ #${id} របស់ ${targetBooking.userName} ត្រូវបានទទួលបានការយល់ព្រម / ទទួលរួចរាល់ហើយ!`;
      } else if (status === 'Completed') {
        title = 'បានបញ្ចប់ការកក់អីវ៉ាន់ (Booking Completed)';
        message = `ការកក់អីវ៉ាន់លេខ #${id} របស់ ${targetBooking.userName} ត្រូវបានបញ្ចប់ការដឹកជញ្ជូនរួចរាល់ជាស្ថាពរ!`;
      } else if (status === 'Cancelled') {
        title = 'បានបដិសេធការកក់អីវ៉ាន់ (Booking Cancelled)';
        message = `ការកក់អីវ៉ាន់លេខ #${id} របស់ ${targetBooking.userName} ត្រូវបានលុបចោល / បដិសេធ!`;
      } else {
        title = 'ស្ថានភាពការកក់អីវ៉ាន់ត្រូវបានផ្លាស់ប្តូរ (Booking Status Updated)';
        message = `ការកក់អីវ៉ាន់លេខ #${id} ត្រូវបានផ្លាស់ប្តូរស្ថានភាពទៅជា ${status}។`;
      }

      const statusNotif: UserNotification = {
        id: `NT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userName: targetBooking.userName,
        title,
        message,
        createdAt: getCambodiaISOString(new Date()),
        isRead: false,
        bookingId: id,
        status,
      };
      setNotifications(prev => [statusNotif, ...prev]);
    }

    // Save cargo bookings to cloud Firestore to synchronize across devices
    await saveStateToFirestore({ cargoBookings: updatedBookings });

    if (!token || !spreadsheetId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncCargoBookingsData(token, spreadsheetId, updatedBookings);
      console.log('Cargo booking status updated.');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពទៅ Google Sheets បានទេ (Failed to sync status)');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteCargoBooking = async (id: string) => {
    const updatedBookings = cargoBookings.filter(b => b.id !== id);
    setCargoBookings(updatedBookings);

    // Save cargo bookings to cloud Firestore to synchronize across devices
    await saveStateToFirestore({ cargoBookings: updatedBookings });

    if (!token || !spreadsheetId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncCargoBookingsData(token, spreadsheetId, updatedBookings);
      console.log('Cargo booking deleted.');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('មិនអាចលុបការកក់ចេញពី Google Sheets បានទេ (Failed to delete booking)');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleAuthExpiry = useCallback(() => {
    setToken(null);
    setUser(null);
    setCurrentUser(null);
    setNeedsAuth(true);
    try {
      localStorage.removeItem('truck_dispatch_google_user');
      localStorage.removeItem('truck_dispatch_google_access_token');
      localStorage.removeItem('truck_dispatch_current_user');
    } catch (e) {
      console.error(e);
    }
  }, []);

  /**
   * Fetch data from Google Sheets.
   */
  const loadDataFromSheets = useCallback(async (accessToken: string, sheetId: string) => {
    setLoading(true);
    setSyncError(null);
    try {
      const { departures: fetchedDeps, trips: fetchedTrips, settings: fetchedSettings, userRoles: fetchedRoles, cargoBookings: fetchedBookings } = await fetchSpreadsheetData(accessToken, sheetId);
      setDepartures(fetchedDeps);
      setTrips(fetchedTrips);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
        localStorage.setItem('truck_dispatch_settings', JSON.stringify(fetchedSettings));
      }
      if (fetchedRoles) {
        setUserRoles(fetchedRoles);
      }
      if (fetchedBookings) {
        setCargoBookings(fetchedBookings);
      }
      setLastSyncedAt(new Date());

      // Save to cloud Firestore to share with Standard users
      await saveStateToFirestore({
        departures: fetchedDeps,
        trips: fetchedTrips,
        settings: fetchedSettings || undefined,
        userRoles: fetchedRoles || undefined,
        cargoBookings: fetchedBookings || undefined,
        spreadsheetId: sheetId,
        spreadsheetUrl: localStorage.getItem('truck_dispatch_spreadsheet_url')
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ សូមចូលគណនីម្តងទៀត។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('មិនអាចទាញយកទិន្នន័យពី Google Sheets របស់អ្នកបានទេ (Could not sync data from Google Sheets)');
      }
    } finally {
      setLoading(false);
    }
  }, [handleAuthExpiry]);

  // Load initial data from Firestore if available, then fallback to Google Sheets if token cached
  useEffect(() => {
    const loadInitialCloudState = async () => {
      try {
        const cloudState = await getStateFromFirestore();
        if (cloudState) {
          console.log('Successfully loaded initial app state from Firestore:', cloudState);
          if (cloudState.departures) setDepartures(cloudState.departures);
          if (cloudState.trips) setTrips(cloudState.trips);
          if (cloudState.settings) {
            setSettings(cloudState.settings);
            localStorage.setItem('truck_dispatch_settings', JSON.stringify(cloudState.settings));
          }
          if (cloudState.userRoles) {
            setUserRoles(cloudState.userRoles);
          }
          if (cloudState.cargoBookings) {
            setCargoBookings(cloudState.cargoBookings);
          }
          if (cloudState.spreadsheetId) {
            setSpreadsheetId(cloudState.spreadsheetId);
            localStorage.setItem('truck_dispatch_spreadsheet_id', cloudState.spreadsheetId);
          }
          if (cloudState.spreadsheetUrl) {
            setSpreadsheetUrl(cloudState.spreadsheetUrl);
            localStorage.setItem('truck_dispatch_spreadsheet_url', cloudState.spreadsheetUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load initial state from Firestore:', err);
      } finally {
        const cachedToken = localStorage.getItem('truck_dispatch_google_access_token');
        const cachedSheetId = localStorage.getItem('truck_dispatch_spreadsheet_id');
        if (cachedToken && cachedSheetId) {
          loadDataFromSheets(cachedToken, cachedSheetId);
        } else {
          setLoading(false);
        }
      }
    };

    loadInitialCloudState();
  }, [loadDataFromSheets]);

  /**
   * Trigger authentication check.
   */
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, accessToken) => {
        setUser(firebaseUser);
        setToken(accessToken);
        try {
          const googleUserObj = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            uid: firebaseUser.uid
          };
          localStorage.setItem('truck_dispatch_google_user', JSON.stringify(googleUserObj));
        } catch (e) {
          console.error(e);
        }
        setNeedsAuth(false);
        
        // Setup spreadsheet
        try {
          const sheetInfo = await findOrCreateSpreadsheet(accessToken);
          setSpreadsheetId(sheetInfo.id);
          setSpreadsheetUrl(sheetInfo.url);
          
          // Load data
          await loadDataFromSheets(accessToken, sheetInfo.id);
        } catch (err: any) {
          console.error(err);
          if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
            handleAuthExpiry();
          } else {
            setSyncError('មិនអាចបង្កើត ឬស្វែងរកឯកសារ Google Sheet បានទេ (Failed to initialize Google Sheet)');
          }
          setLoading(false);
        }
      },
      () => {
        setNeedsAuth(true);
        const cachedToken = localStorage.getItem('truck_dispatch_google_access_token');
        const cachedSheetId = localStorage.getItem('truck_dispatch_spreadsheet_id');
        if (!cachedToken || !cachedSheetId) {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [loadDataFromSheets, handleAuthExpiry]);

  // Synchronize Google authenticated user with the credential session (currentUser)
  useEffect(() => {
    try {
      if (localStorage.getItem('truck_dispatch_manually_logged_out') === 'true') {
        return;
      }
    } catch (e) {
      console.error(e);
    }

    if (user && !currentUser) {
      const googleEmail = user.email || '';
      const googleEmailLower = googleEmail.trim().toLowerCase();
      
      // Look for match in userRoles (either email or username match)
      const matchingRole = userRoles.find(r => r.email.trim().toLowerCase() === googleEmailLower);
      
      if (matchingRole) {
        const u = { email: matchingRole.email, name: matchingRole.name, role: matchingRole.role };
        setCurrentUser(u);
        localStorage.setItem('truck_dispatch_current_user', JSON.stringify(u));
      } else {
        // Fallback for rathykim34@gmail.com (owner) or if userRoles has no configuration yet
        const isOwner = googleEmailLower === 'rathykim34@gmail.com';
        const hasNoRoles = userRoles.length === 0;
        
        if (isOwner || hasNoRoles) {
          const u = { 
            email: googleEmail || 'admin', 
            name: user.displayName || 'អ្នកគ្រប់គ្រង (Admin)', 
            role: 'Admin' as const 
          };
          setCurrentUser(u);
          localStorage.setItem('truck_dispatch_current_user', JSON.stringify(u));
        }
      }
    }
  }, [user, currentUser, userRoles]);

  // Keep stable reference of departures, trips, tokens, etc. for real-time background sync
  const stateRef = useRef({ departures, trips, settings, userRoles, cargoBookings, token, spreadsheetId, syncing, loading });
  useEffect(() => {
    stateRef.current = { departures, trips, settings, userRoles, cargoBookings, token, spreadsheetId, syncing, loading };
  }, [departures, trips, settings, userRoles, cargoBookings, token, spreadsheetId, syncing, loading]);

  // Periodic polling for real-time updates from Google Sheets
  useEffect(() => {
    if (!token || !spreadsheetId || !isPollingEnabled) return;

    const intervalId = setInterval(async () => {
      const { token: currentToken, spreadsheetId: currentSheetId, syncing: isSyncing, loading: isLoading } = stateRef.current;
      if (!currentToken || !currentSheetId || isSyncing || isLoading) return;

      setIsPolling(true);
      try {
        const { departures: fetchedDeps, trips: fetchedTrips, settings: fetchedSettings, userRoles: fetchedRoles, cargoBookings: fetchedBookings } = await fetchSpreadsheetData(currentToken, currentSheetId);
        
        // Deep comparison to check if there are actual changes
        const currentDepsStr = JSON.stringify(stateRef.current.departures);
        const currentTripsStr = JSON.stringify(stateRef.current.trips);
        const currentSettingsStr = JSON.stringify(stateRef.current.settings);
        const currentRolesStr = JSON.stringify(stateRef.current.userRoles);
        const currentBookingsStr = JSON.stringify(stateRef.current.cargoBookings);
        const fetchedDepsStr = JSON.stringify(fetchedDeps);
        const fetchedTripsStr = JSON.stringify(fetchedTrips);
        const fetchedSettingsStr = fetchedSettings ? JSON.stringify(fetchedSettings) : currentSettingsStr;
        const fetchedRolesStr = fetchedRoles ? JSON.stringify(fetchedRoles) : currentRolesStr;
        const fetchedBookingsStr = fetchedBookings ? JSON.stringify(fetchedBookings) : currentBookingsStr;

        if (fetchedDepsStr !== currentDepsStr || fetchedTripsStr !== currentTripsStr) {
          setDepartures(fetchedDeps);
          setTrips(fetchedTrips);
          console.log('Real-time update: Found and synced changes from Google Sheets.');
        }
        if (fetchedSettings && fetchedSettingsStr !== currentSettingsStr) {
          setSettings(fetchedSettings);
          localStorage.setItem('truck_dispatch_settings', JSON.stringify(fetchedSettings));
          console.log('Real-time update: Found and synced settings from Google Sheets.');
        }
        if (fetchedRoles && fetchedRolesStr !== currentRolesStr) {
          setUserRoles(fetchedRoles);
          console.log('Real-time update: Found and synced user roles from Google Sheets.');
        }
        if (fetchedBookings && fetchedBookingsStr !== currentBookingsStr) {
          setCargoBookings(fetchedBookings);
          console.log('Real-time update: Found and synced cargo bookings from Google Sheets.');
        }
        setLastSyncedAt(new Date());
        setSyncError(null);
      } catch (err: any) {
        console.error('Real-time background sync failed:', err);
        if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
          setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
          handleAuthExpiry();
        }
      } finally {
        setIsPolling(false);
      }
    }, 5000); // Poll every 5 seconds for real-time updates

    return () => clearInterval(intervalId);
  }, [token, spreadsheetId, isPollingEnabled, handleAuthExpiry]);

  /**
   * Helper function to perform data sync with Google Sheets.
   */
  const syncWithSheets = async (updatedDeps: Departure[], updatedTrips: Trip[], updatedSettings?: AppSettings) => {
    // Save to Firestore first for instant sharing
    await saveStateToFirestore({
      departures: updatedDeps,
      trips: updatedTrips,
      settings: updatedSettings || settings,
    });

    if (!token || !spreadsheetId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await syncSpreadsheetData(token, spreadsheetId, updatedDeps, updatedTrips, updatedSettings || settings);
      setLastSyncedAt(new Date());
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('expired token')) {
        setSyncError('សញ្ញាសម្គាល់ការចូលគណនីបានហួសកំណត់។ (OAuth session expired. Please sign in again.)');
        handleAuthExpiry();
      } else {
        setSyncError('ការផ្ញើទិន្នន័យទៅ Drive មិនបានជោគជ័យ (Failed to sync with Google Sheets)');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleLoginSuccess = async (loggedInUser: User, accessToken: string) => {
    try {
      localStorage.removeItem('truck_dispatch_manually_logged_out');
    } catch (e) {}
    setUser(loggedInUser);
    setToken(accessToken);
    try {
      const googleUserObj = {
        email: loggedInUser.email,
        displayName: loggedInUser.displayName,
        uid: loggedInUser.uid
      };
      localStorage.setItem('truck_dispatch_google_user', JSON.stringify(googleUserObj));
    } catch (e) {
      console.error(e);
    }
    setNeedsAuth(false);
    setLoading(true);
    
    try {
      const sheetInfo = await findOrCreateSpreadsheet(accessToken);
      setSpreadsheetId(sheetInfo.id);
      setSpreadsheetUrl(sheetInfo.url);
      await loadDataFromSheets(accessToken, sheetInfo.id);
    } catch (err: any) {
      console.error(err);
      setSyncError('មិនអាចទាញយកព័ត៌មានពី Google Drive (Could not read Google Drive details)');
      setLoading(false);
    }
  };

  const handleGoogleDisconnect = () => {
    askConfirmation(
      'ផ្តាច់ការភ្ជាប់ Google Sheets (Disconnect Google Sheets)',
      'តើអ្នកចង់ផ្តាច់គណនី Google Sheets មែនទេ? (Are you sure you want to disconnect Google Sheets?)',
      async () => {
        try {
          await logoutUser();
        } catch (e) {
          console.error(e);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('truck_dispatch_google_user');
        localStorage.removeItem('truck_dispatch_google_access_token');
        localStorage.removeItem('truck_dispatch_spreadsheet_id');
        localStorage.removeItem('truck_dispatch_spreadsheet_url');
        setSpreadsheetUrl(null);
      },
      'warning'
    );
  };

  const handleLogout = () => {
    askConfirmation(
      'ចាកចេញពីគណនី (Sign Out)',
      'តើអ្នកចង់ចាកចេញពីប្រព័ន្ធមែនទេ? (Are you sure you want to sign out?)',
      async () => {
        try {
          localStorage.setItem('truck_dispatch_manually_logged_out', 'true');
        } catch (e) {}
        setCurrentUser(null);
        try {
          localStorage.removeItem('truck_dispatch_current_user');
        } catch (e) {}
      },
      'warning'
    );
  };

  // ----------------------------------------------------
  // DEPARTURE ACTIONS
  // ----------------------------------------------------

  const handleOpenAddDeparture = () => {
    setSelectedDeparture(null);
    setShowDepartureForm(true);
  };

  const handleOpenEditDeparture = (dep: Departure) => {
    setSelectedDeparture(dep);
    setShowDepartureForm(true);
  };

  const handleSaveDeparture = async (formData: Omit<Departure, 'id' | 'createdAt'> & { id?: string }) => {
    let updatedDeps: Departure[];

    if (formData.id) {
      // Editing existing departure
      updatedDeps = departures.map((d) => 
        d.id === formData.id 
          ? { 
              ...d, 
              ...formData, 
              id: d.id, 
              createdAt: d.createdAt 
            } 
          : d
      );
    } else {
      // Add new departure
      const newDep: Departure = {
        ...formData,
        id: `DEP-${Date.now()}`,
        createdAt: getCambodiaISOString()
      };
      updatedDeps = [newDep, ...departures];
    }

    setDepartures(updatedDeps);
    setShowDepartureForm(false);
    setSelectedDeparture(null);

    // Sync in background
    await syncWithSheets(updatedDeps, trips);
  };

  const handleCancelDeparture = (dep: Departure) => {
    askConfirmation(
      'បោះបង់ការចេញដំណើរ (Cancel Departure)',
      `តើអ្នកពិតជាចង់បោះបង់ការចេញដំណើរសម្រាប់ឡានស្លាកលេខ "${dep.plateNumber}" មែនទេ? (Are you sure you want to cancel departure for ${dep.plateNumber}?)`,
      async () => {
        const updatedDeps = departures.map((d) => 
          d.id === dep.id ? { ...d, status: 'Cancelled' as const } : d
        );
        setDepartures(updatedDeps);
        await syncWithSheets(updatedDeps, trips);
      },
      'danger'
    );
  };

  const handleOpenDispatchForm = (dep: Departure) => {
    setDispatchingDeparture(dep);
    setSelectedTrip(null);
    setShowTripForm(true);
  };

  // ----------------------------------------------------
  // TRIP ACTIONS
  // ----------------------------------------------------

  const handleOpenEditTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setDispatchingDeparture(null);
    setShowTripForm(true);
  };

  const handleSaveTrip = async (formData: Omit<Trip, 'tripId'> & { tripId?: string }) => {
    let updatedTrips: Trip[];
    let updatedDeps = [...departures];

    if (formData.tripId) {
      // Editing existing trip
      updatedTrips = trips.map((t) => 
        t.tripId === formData.tripId ? { ...t, ...formData, tripId: t.tripId } : t
      );
      
      // If trip status is Completed, update linked departure status to Arrived
      if (formData.status === 'Completed') {
        updatedDeps = departures.map((d) => 
          d.id === formData.departureId ? { ...d, status: 'Arrived' as const } : d
        );
      } else {
        updatedDeps = departures.map((d) => 
          d.id === formData.departureId ? { ...d, status: 'Dispatched' as const } : d
        );
      }
    } else {
      // Create new trip from dispatch
      const newTrip: Trip = {
        ...formData,
        tripId: `TRIP-${Date.now()}`
      };
      updatedTrips = [newTrip, ...trips];

      // Mark the corresponding departure as Dispatched
      if (dispatchingDeparture) {
        updatedDeps = departures.map((d) => 
          d.id === dispatchingDeparture.id ? { ...d, status: 'Dispatched' as const } : d
        );
      }
    }

    setTrips(updatedTrips);
    setDepartures(updatedDeps);
    setShowTripForm(false);
    setSelectedTrip(null);
    setDispatchingDeparture(null);

    // Sync
    await syncWithSheets(updatedDeps, updatedTrips);
  };

  const handleCompleteTrip = (trip: Trip) => {
    askConfirmation(
      'បញ្ចប់ជើងដឹកជញ្ជូន (Complete Trip)',
      `តើអ្នកចង់កត់ត្រាបញ្ចប់ជើងដឹកជញ្ជូនសម្រាប់ឡានស្លាកលេខ "${trip.plateNumber}" ជាផ្លូវការមែនទេ? (Are you sure you want to complete the trip for ${trip.plateNumber}?)`,
      async () => {
        const actualArrival = getCambodiaDateTimeLocalString();

        const updatedTrips = trips.map((t) => 
          t.tripId === trip.tripId ? { ...t, status: 'Completed' as const, actualArrivalDateTime: actualArrival } : t
        );

        // Update departure status to Arrived
        const updatedDeps = departures.map((d) => 
          d.id === trip.departureId ? { ...d, status: 'Arrived' as const } : d
        );

        setTrips(updatedTrips);
        setDepartures(updatedDeps);
        await syncWithSheets(updatedDeps, updatedTrips);
      },
      'success'
    );
  };

  const handleDelayTrip = (trip: Trip) => {
    askConfirmation(
      'កត់ត្រាយឺតយ៉ាវ (Mark Trip Delayed)',
      `តើអ្នកចង់ផ្លាស់ប្តូរស្ថានភាពទៅជាយឺតយ៉ាវសម្រាប់ឡានស្លាកលេខ "${trip.plateNumber}" មែនទេ? (Are you sure you want to mark trip for ${trip.plateNumber} as delayed?)`,
      async () => {
        const updatedTrips = trips.map((t) => 
          t.tripId === trip.tripId ? { ...t, status: 'Delayed' as const } : t
        );
        setTrips(updatedTrips);
        await syncWithSheets(departures, updatedTrips);
      },
      'warning'
    );
  };

  const handleDeleteTrip = (trip: Trip) => {
    askConfirmation(
      'លុបជើងដឹកជញ្ជូន (Delete Trip)',
      `តើអ្នកចង់លុបជើងដឹកជញ្ជូន "${trip.routeName}" របស់ឡានស្លាកលេខ "${trip.plateNumber}" ចេញពីប្រព័ន្ធមែនទេ? (This action will delete trip data from Google Drive.)`,
      async () => {
        const updatedTrips = trips.filter((t) => t.tripId !== trip.tripId);
        
        // Revert linked departure status to Scheduled
        const updatedDeps = departures.map((d) => 
          d.id === trip.departureId ? { ...d, status: 'Scheduled' as const } : d
        );

        setTrips(updatedTrips);
        setDepartures(updatedDeps);
        await syncWithSheets(updatedDeps, updatedTrips);
      },
      'danger'
    );
  };

  // Determine if user has Admin/Standard role and filter departures/trips/bookings
  const { isAdmin, canManage, assignedDriver, allowedDepartures, allowedTrips, allowedBookings, currentUserRoleRecord } = useMemo(() => {
    const currentUserRoleRecord = currentUser?.email
      ? userRoles.find((r) => r.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
      : null;

    // If no roles are set up in the sheet yet (brand new system) or logged in as 'admin', default to Admin.
    const isUserAdmin = userRoles.length === 0 || 
                        currentUser?.email === 'admin' || 
                        currentUserRoleRecord?.role?.toLowerCase() === 'admin' || 
                        currentUser?.role?.toLowerCase() === 'admin';
    const driverRestriction = currentUserRoleRecord?.assignedDriver || null;
    const allowedDrivers = driverRestriction 
      ? driverRestriction.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) 
      : [];
    const userNameRestriction = currentUserRoleRecord?.name || currentUser?.name || null;

    // Filter departures
    const filteredDeps = isUserAdmin
      ? departures
      : departures.filter((d) => {
          const dNameLower = d.driverName ? d.driverName.trim().toLowerCase() : '';
          const dispLower = d.dispatcher ? d.dispatcher.trim().toLowerCase() : '';
          
          const matchDriver = allowedDrivers.length > 0 && allowedDrivers.includes(dNameLower);
          const matchUserName = userNameRestriction && (dNameLower === userNameRestriction.trim().toLowerCase() || dispLower === userNameRestriction.trim().toLowerCase());
          
          return matchDriver || matchUserName;
        });

    // Filter trips
    const allowedDepIds = new Set(filteredDeps.map(d => d.id));
    const filteredTrips = isUserAdmin
      ? trips
      : trips.filter((t) => {
          const tDispLower = t.dispatcher ? t.dispatcher.trim().toLowerCase() : '';
          const matchDispatcher = userNameRestriction && tDispLower === userNameRestriction.trim().toLowerCase();
          
          const matchesDriver = t.plateNumber && (() => {
            const dep = departures.find(d => d.plateNumber === t.plateNumber);
            if (!dep) return false;
            const depDriverLower = dep.driverName ? dep.driverName.trim().toLowerCase() : '';
            return allowedDrivers.includes(depDriverLower) || depDriverLower === (userNameRestriction || '').toLowerCase();
          })();
          
          return matchDispatcher || matchesDriver || allowedDepIds.has(t.departureId);
        });

    // Filter cargo bookings
    const filteredBookings = isUserAdmin
      ? cargoBookings
      : cargoBookings.filter((b) => {
          const bUserLower = b.userName ? b.userName.trim().toLowerCase() : '';
          const bCreatorLower = b.creatorEmail ? b.creatorEmail.trim().toLowerCase() : '';
          const userEmailLower = currentUser?.email ? currentUser.email.trim().toLowerCase() : '';
          
          const matchUserName = userNameRestriction && bUserLower === userNameRestriction.trim().toLowerCase();
          const matchDriverName = allowedDrivers.length > 0 && allowedDrivers.includes(bUserLower);
          const matchCreatorEmail = userEmailLower && bCreatorLower === userEmailLower;
          
          return matchUserName || matchDriverName || matchCreatorEmail;
        });

    return {
      isAdmin: isUserAdmin,
      canManage: isUserAdmin, // Standard users are view-only ("use normally" without modifications)
      assignedDriver: driverRestriction,
      allowedDepartures: filteredDeps,
      allowedTrips: filteredTrips,
      allowedBookings: filteredBookings,
      currentUserRoleRecord
    };
  }, [currentUser, userRoles, departures, trips, cargoBookings]);

  // Filter notifications based on user name/role
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    const currentUserRoleRecord = currentUser.email
      ? userRoles.find((r) => r.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
      : null;

    // Check if user is Admin or if no roles exist yet (defaults to Admin behavior)
    const isUserAdmin = userRoles.length === 0 || 
                        currentUser.email === 'admin' || 
                        currentUserRoleRecord?.role?.toLowerCase() === 'admin' || 
                        currentUser.role?.toLowerCase() === 'admin';
    
    if (isUserAdmin) {
      return notifications; // Admins can see and manage all notifications
    }
    
    if (!currentUserRoleRecord) {
      return []; // No matching role and not Admin -> no notifications
    }

    // Standard user can only see notifications that are assigned/targeted to their registered Name
    return notifications.filter(n => n.userName?.toLowerCase() === currentUserRoleRecord.name?.toLowerCase());
  }, [notifications, currentUser, userRoles]);

  // Prevent standard users from accessing settings or permissions
  useEffect(() => {
    if (!isAdmin && (activeTab === 'settings' || activeTab === 'permissions')) {
      setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  // Render Auth screen if user is not logged in via Username / Password
  if (!currentUser) {
    return (
      <AuthScreen
        userRoles={userRoles}
        onLoginCustom={(role) => {
          try {
            localStorage.removeItem('truck_dispatch_manually_logged_out');
          } catch (e) {}
          setCurrentUser({ email: role.email, name: role.name, role: role.role });
          localStorage.setItem('truck_dispatch_current_user', JSON.stringify({ email: role.email, name: role.name, role: role.role }));
        }}
        onRegisterCustom={async (role) => {
          const exists = userRoles.some(
            (r) => r.email.trim().toLowerCase() === role.email.trim().toLowerCase()
          );
          if (exists) {
            throw new Error('ឈ្មោះគណនី ឬអ៊ីមែលនេះមានរួចហើយ! (This username/email already exists!)');
          }
          const updatedRoles = [...userRoles, role];
          setUserRoles(updatedRoles);

          // Save to Firestore so other devices/standard users can see and log in immediately
          await saveStateToFirestore({ userRoles: updatedRoles });
          
          const cachedToken = token || localStorage.getItem('truck_dispatch_google_access_token');
          const cachedSheetId = spreadsheetId || localStorage.getItem('truck_dispatch_spreadsheet_id');
          if (cachedToken && cachedSheetId) {
            try {
              await syncUserRolesData(cachedToken, cachedSheetId, updatedRoles);
            } catch (e) {
              console.error('Failed to sync registered user to sheets:', e);
            }
          }
        }}
      />
    );
  }

  // Check if there is any user explicitly registered in userRoles
  const hasConfiguredRoles = userRoles.length > 0;
  // If roles are configured, the logged-in user MUST have a role record to access the app
  const isAuthorized = !hasConfiguredRoles || currentUser.email === 'admin' || !!currentUserRoleRecord;

  // Render Access Denied if user is logged in but not authorized in UserRoles
  if (currentUser && !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left">
        <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-2xl shadow-lg border border-red-200 text-red-600">
              <ShieldAlert className="h-12 w-12" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900 font-sans">
            គណនីគ្មានសិទ្ធិចូលប្រើប្រាស់
          </h2>
          <p className="mt-1 text-center text-sm text-red-600 font-bold font-sans">
            Access Denied
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 sm:rounded-2xl sm:px-10 border border-slate-150 space-y-5 text-center">
            <div className="text-slate-700 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">គណនីកំពុងប្រើប្រាស់</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-red-600 font-bold break-all">
                {currentUser?.email}
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                គណនីរបស់អ្នកមិនមានសិទ្ធិចូលប្រើប្រាស់ក្នុងប្រព័ន្ធនេះទេ។
              </p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                សូមទាក់ទងមកកាន់អ្នកគ្រប់គ្រង (Admin) ដើម្បីកំណត់សិទ្ធិឡើងវិញនៅក្នុង «ការគ្រប់គ្រងសិទ្ធិអ្នកប្រើប្រាស់»។
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all cursor-pointer shadow-red-100 shadow-lg"
            >
              <LogOut className="h-4 w-4" />
              ចាកចេញពីគណនី (Sign Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
              ប្រព័ន្ធគ្រប់គ្រងជើងឡាន
            </h1>
            <p className="text-[9px] text-slate-400 font-medium font-sans">ចាត់ចែងឡាន និងជើងដឹកជញ្ជូន</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Real-time Status and Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-[10px] select-none">
              <span className="relative flex h-2 w-2">
                {isPollingEnabled && !isPolling && !syncing && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  syncing ? 'bg-amber-400 animate-pulse' :
                  isPolling ? 'bg-blue-400 animate-pulse' :
                  isPollingEnabled ? 'bg-emerald-400' : 'bg-slate-500'
                }`}></span>
              </span>
              <span className="font-bold text-slate-300 font-sans">
                {syncing ? 'កំពុងរក្សាទុក... (Saving...)' :
                 isPolling ? 'កំពុងទាញយក... (Syncing...)' :
                 isPollingEnabled ? 'អាប់ដេតស្វ័យប្រវត្ត (Auto-Sync Active)' : 'អាប់ដេតបិទ (Auto-Sync Off)'}
              </span>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => {
                if (!token || !spreadsheetId || loading || syncing || isPolling) return;
                loadDataFromSheets(token, spreadsheetId);
              }}
              disabled={loading || syncing || isPolling}
              className={`p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer`}
              title="ទាញយកទិន្នន័យឡើងវិញ (Sync Now)"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPolling || syncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsPollingEnabled(!isPollingEnabled)}
              className={`px-2 py-1 border rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                isPollingEnabled 
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40' 
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
              title={isPollingEnabled ? "បិទការអាប់ដេតស្វ័យប្រវត្ត (Disable Auto-Sync)" : "បើកការអាប់ដេតស្វ័យប្រវត្ត (Enable Auto-Sync)"}
            >
              {isPollingEnabled ? 'AUTO' : 'MANUAL'}
            </button>
          </div>

          {/* User Profile Info */}
          {currentUser && (
            <div className="flex items-center gap-3">
              {/* Notification Center Bell & Slider */}
              <NotificationCenter
                notifications={userNotifications}
                bookings={allowedBookings}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDeleteNotification={handleDeleteNotification}
                onClearAll={handleClearAllNotifications}
                onUpdateBookingStatus={handleUpdateCargoBookingStatus}
                canManage={isAdmin}
              />

              <div className="hidden md:block text-right border-l border-slate-800 pl-3">
                <span className="text-xs font-bold block leading-none text-white">
                  {currentUserRoleRecord?.name || currentUser.name || (isAdmin ? 'អ្នកគ្រប់គ្រង' : 'អ្នកប្រើប្រាស់')}
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase shrink-0 ${
                    isAdmin ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isAdmin ? 'Admin' : 'Standard'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-sans font-medium">{currentUser.email}</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-inner uppercase ${isAdmin ? 'bg-rose-600' : 'bg-blue-600'}`}>
                {(currentUserRoleRecord?.name || currentUser.name || 'US').slice(0, 2)}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                title="ចាកចេញ"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body with Side Nav + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 shrink-0 hidden md:flex text-left">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 font-sans">មឺនុយមេ (Main Menu)</div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-500" />
            <span>ផ្ទាំងគ្រប់គ្រង (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('departures')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
              activeTab === 'departures'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="h-4 w-4 shrink-0 text-slate-500" />
            <span>ឡានចេញដំណើរ (Departures)</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
              activeTab === 'trips'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Navigation className="h-4 w-4 shrink-0 text-slate-500" />
            <span>ជើងដឹកជញ្ជូន (Trips Tracking)</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
              activeTab === 'bookings'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Box className="h-4 w-4 shrink-0 text-slate-500" />
            <span>កក់អីវ៉ាន់ (Cargo Bookings)</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
                  activeTab === 'permissions'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                <span>ការគ្រប់គ្រងសិទ្ធិ (Permissions)</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer text-left ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sliders className="h-4 w-4 shrink-0 text-slate-500" />
                <span>ការកំណត់ប្រព័ន្ធ (Settings)</span>
              </button>
            </>
          )}



          {/* Drive Storage Status Widget */}
          <div className="mt-auto p-3 bg-blue-50/50 rounded-xl border border-blue-100/80">
            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Drive Storage</p>
            <div className="w-full bg-blue-200 h-1.5 rounded-full mb-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '33%' }}></div>
            </div>
            <p className="text-[9px] text-blue-700 font-semibold font-sans">1.5 MB / 15 GB ប្រើប្រាស់</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Navigation Tabs */}
          <div className="md:hidden flex border-b border-slate-200 bg-white shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 mb-0.5" />
              ផ្ទាំងគ្រប់គ្រង
            </button>
            <button
              onClick={() => setActiveTab('departures')}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                activeTab === 'departures'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Truck className="h-4 w-4 mb-0.5" />
              ឡានចេញដំណើរ
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                activeTab === 'trips'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Navigation className="h-4 w-4 mb-0.5" />
              ជើងដឹកជញ្ជូន
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                activeTab === 'bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Box className="h-4 w-4 mb-0.5" />
              កក់អីវ៉ាន់
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                    activeTab === 'permissions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 mb-0.5" />
                  កំណត់សិទ្ធិ
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold border-b-2 ${
                    activeTab === 'settings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400'
                  }`}
                >
                  <Sliders className="h-4 w-4 mb-0.5" />
                  ការកំណត់
                </button>
              </>
            )}
          </div>

          {/* Syncing Status Mobile Bar */}
          <div className="sm:hidden bg-slate-50 px-4 py-1.5 border-b border-slate-200 flex justify-between items-center text-[10px] shrink-0">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-slate-500 font-medium">
                {syncing ? 'កំពុងរក្សាទុក...' : 'Google Sheets: ភ្ជាប់រួចរាល់'}
              </span>
            </div>
            {syncError && <span className="text-red-500 font-bold">{syncError}</span>}
          </div>

          {/* Scrollable Container */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-100/60 text-slate-800">
            {syncError && (
              <div id="sync-error-banner" className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{syncError}</span>
                </div>
                <button 
                  onClick={() => spreadsheetId && loadDataFromSheets(token!, spreadsheetId)} 
                  className="px-2 py-0.5 bg-white hover:bg-red-100 text-red-700 font-bold rounded border border-red-200 transition-colors text-[10px]"
                >
                  ព្យាយាមម្តងទៀត
                </button>
              </div>
            )}

            {loading ? (
              <div id="loading-spinner" className="h-full flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-semibold font-sans">កំពុងទាញយកព័ត៌មានពី Google Drive...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'dashboard' && (
                  <Dashboard departures={allowedDepartures} trips={allowedTrips} />
                )}
                {activeTab === 'departures' && (
                  <DepartureList
                    departures={allowedDepartures}
                    onAddClick={handleOpenAddDeparture}
                    onEditClick={handleOpenEditDeparture}
                    onCancelClick={handleCancelDeparture}
                    onDispatchClick={handleOpenDispatchForm}
                    canManage={canManage}
                  />
                )}
                {activeTab === 'trips' && (
                  <TripList
                    trips={allowedTrips}
                    onEditClick={handleOpenEditTrip}
                    onCompleteClick={handleCompleteTrip}
                    onDelayClick={handleDelayTrip}
                    onDeleteClick={handleDeleteTrip}
                    canManage={canManage}
                  />
                )}
                {activeTab === 'bookings' && (
                  <BookingList
                    bookings={allowedBookings}
                    userRoles={userRoles}
                    settings={settings}
                    onAddBooking={handleAddCargoBooking}
                    onUpdateBookingStatus={handleUpdateCargoBookingStatus}
                    onDeleteBooking={handleDeleteCargoBooking}
                    canManage={isAdmin}
                    currentUserEmail={currentUser?.email || ''}
                    token={token}
                  />
                )}
                {activeTab === 'permissions' && isAdmin && (
                  <PermissionsTab
                    userRoles={userRoles}
                    onUpdateUserRoles={handleUpdateUserRoles}
                    settings={settings}
                  />
                )}
                {activeTab === 'settings' && isAdmin && (
                  <SettingsTab
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onResetSettings={handleResetSettings}
                    spreadsheetUrl={spreadsheetUrl}
                    onForcePushAll={handleForcePushAll}
                    googleUser={user}
                    onGoogleSignInSuccess={handleLoginSuccess}
                    onGoogleDisconnect={handleGoogleDisconnect}
                  />
                )}
              </div>
            )}
          </main>

          {/* Status Bar Footer */}
          <footer className="h-8 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-6 text-[10px] font-bold text-slate-600 shrink-0 select-none">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPollingEnabled ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span> កំណែ 2.4.0
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline">
                បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ {lastSyncedAt ? formatTime(lastSyncedAt) : 'ទើបតែឥឡូវនេះ'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className={`h-3.5 w-3.5 text-blue-600 ${syncing || isPolling ? 'animate-pulse' : ''}`} />
                Sync Status: {syncing ? 'Saving...' : isPolling ? 'Syncing...' : 'Connected'}
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* Modal overlays */}
      {showDepartureForm && (
        <DepartureForm
          departure={selectedDeparture}
          settings={settings}
          onSave={handleSaveDeparture}
          onClose={() => {
            setShowDepartureForm(false);
            setSelectedDeparture(null);
          }}
        />
      )}

      {showTripForm && (
        <TripForm
          trip={selectedTrip}
          departure={dispatchingDeparture}
          currentUserEmail={currentUser?.email || 'Dispatcher'}
          settings={settings}
          onSave={handleSaveTrip}
          onClose={() => {
            setShowTripForm(false);
            setSelectedTrip(null);
            setDispatchingDeparture(null);
          }}
        />
      )}

      {/* Custom Confirmation Dialog */}
      {confirmDialog?.isOpen && (
        <div id="confirmation-dialog-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl p-5 border border-slate-200 text-center space-y-3.5 animate-scale-up">
            <div className="flex justify-center">
              <div className={`p-2.5 rounded-full ${
                confirmDialog.type === 'danger' ? 'bg-red-50 text-red-600' :
                confirmDialog.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                confirmDialog.type === 'info' ? 'bg-blue-50 text-blue-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {confirmDialog.type === 'danger' && <AlertTriangle className="h-5 w-5" />}
                {confirmDialog.type === 'warning' && <HelpCircle className="h-5 w-5" />}
                {confirmDialog.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
                {confirmDialog.type === 'info' && <HelpCircle className="h-5 w-5" />}
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{confirmDialog.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>

            <div className="flex gap-2 justify-center pt-1.5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                  confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  confirmDialog.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  confirmDialog.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                យល់ព្រម (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
