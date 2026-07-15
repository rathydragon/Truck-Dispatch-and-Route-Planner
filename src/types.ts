export interface Departure {
  id: string;
  plateNumber: string;
  driverName: string;
  departureDateTime: string;
  startLocation: string;
  endLocation: string;
  cargoType?: string;
  weight?: number; // in tons
  status: 'Scheduled' | 'Dispatched' | 'Arrived' | 'Cancelled';
  notes: string;
  commission?: number; // in USD (commission / កម្រៃជើងសារ)
  fuelLiters?: number; // in liters (ប្រេងផ្តល់ជូន/លីត្រ)
  createdAt: string;
}

export interface Trip {
  tripId: string;
  departureId: string;
  plateNumber: string;
  routeName: string;
  distanceKm: number;
  fuelAllocated: number; // in liters
  commission?: number; // in USD (commission / កម្រៃជើងសារ)
  estDuration: string; // e.g., "4 hours", "1 day"
  dispatcher: string;
  actualArrivalDateTime?: string;
  cargoValue?: number; // in USD
  status: 'In Progress' | 'Completed' | 'Delayed';
}

export interface UserRole {
  email: string;
  name: string;
  role: 'Admin' | 'Standard';
  assignedDriver?: string; // Driver Name from driverNames list, or empty for all
}

export interface AppSettings {
  plateNumbers: string[];
  driverNames: string[];
  destinations: string[];
  commissions: number[];
  fuelAmounts: number[];
  zones?: string[];
}

export interface CargoBooking {
  id: string;
  locationName: string;
  phoneNumber: string;
  zone: string;
  userName: string;
  createdAt: string;
  creatorEmail: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  linkLocation?: string;
  photoUrl?: string;
}

export interface UserNotification {
  id: string;
  userName: string; // Target user's name
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  bookingId: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
}

export interface AppData {
  departures: Departure[];
  trips: Trip[];
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
}
