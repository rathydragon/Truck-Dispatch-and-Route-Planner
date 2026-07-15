import { Departure, Trip, AppSettings, UserRole, CargoBooking } from '../types';

const SPREADSHEET_NAME = 'ប្រព័ន្ធគ្រប់គ្រងការចេញដំណើរឡាន_Truck_Dispatch_Database';

/**
 * Searches for the dispatcher database spreadsheet in the user's Google Drive.
 * If not found, creates it with the necessary tabs ("Departures" and "Trips") and headers.
 */
export async function findOrCreateSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  try {
    // 1. Search for the file in Google Drive
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(SPREADSHEET_NAME)}'+and+mimeType='application/vnd.google-apps.spreadsheet'+and+trashed=false&fields=files(id,name,webViewLink)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      throw new Error('មិនអាចស្វែងរកឯកសារក្នុង Google Drive បានទេ (Failed to search Google Drive)');
    }

    const searchData = await searchRes.json();
    let fileId = '';
    let webViewLink = '';

    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
      webViewLink = searchData.files[0].webViewLink;
      console.log('พบไฟล์ Spreadsheet เดิมที่มีរួចហើយ (Found existing Spreadsheet):', fileId);
    } else {
      // 2. Create a new Spreadsheet
      console.log('រកមិនឃើញឯកសារចាស់ទេ កំពុងបង្កើតថ្មី... (Spreadsheet not found, creating new one...)');
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: SPREADSHEET_NAME,
          mimeType: 'application/vnd.google-apps.spreadsheet',
        }),
      });

      if (!createRes.ok) {
        throw new Error('មិនអាចបង្កើតឯកសារ Google Sheet ថ្មីបានទេ (Failed to create new Spreadsheet)');
      }

      const createData = await createRes.json();
      fileId = createData.id;
      webViewLink = `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    }

    // 3. Ensure "Departures" and "Trips" tabs exist
    await ensureTabsExist(accessToken, fileId);

    return { id: fileId, url: webViewLink };
  } catch (err) {
    console.error('Error in findOrCreateSpreadsheet:', err);
    throw err;
  }
}

/**
 * Verifies if "Departures" and "Trips" sheets are present. Creates them if missing.
 */
async function ensureTabsExist(accessToken: string, spreadsheetId: string): Promise<void> {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('មិនអាចទាញយកព័ត៌មានលម្អិតរបស់ Google Sheet បានទេ (Failed to fetch spreadsheet details)');
  }

  const data = await res.json();
  const sheets = data.sheets || [];
  const titles = sheets.map((s: any) => s.properties.title);

  const requests: any[] = [];
  let departuresCreated = titles.includes('Departures');
  let tripsCreated = titles.includes('Trips');
  let settingsCreated = titles.includes('Settings');
  let userRolesCreated = titles.includes('UserRoles');
  let cargoBookingsCreated = titles.includes('CargoBookings');

  if (!departuresCreated) {
    requests.push({
      addSheet: {
        properties: { title: 'Departures' },
      },
    });
  }
  if (!tripsCreated) {
    requests.push({
      addSheet: {
        properties: { title: 'Trips' },
      },
    });
  }
  if (!settingsCreated) {
    requests.push({
      addSheet: {
        properties: { title: 'Settings' },
      },
    });
  }
  if (!userRolesCreated) {
    requests.push({
      addSheet: {
        properties: { title: 'UserRoles' },
      },
    });
  }
  if (!cargoBookingsCreated) {
    requests.push({
      addSheet: {
        properties: { title: 'CargoBookings' },
      },
    });
  }

  // If we have to add sheets, execute the batchUpdate
  if (requests.length > 0) {
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      throw new Error('មិនអាចបង្កើតសន្លឹកបៀរថ្មីក្នុង Sheet បានទេ (Failed to create new sheets inside Spreadsheet)');
    }
    console.log('បានបង្កើតសន្លឹកបៀរថ្មីរួចរាល់ (Successfully added missing sheet tabs)');
  }

  // Optional: Delete "Sheet1" if it exists to keep it clean
  const sheet1 = sheets.find((s: any) => s.properties.title === 'Sheet1');
  if (sheet1 && (departuresCreated || requests.some(r => r.addSheet?.properties?.title === 'Departures'))) {
    // Only delete Sheet1 if we have successfully set up or have departures/trips
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              deleteSheet: {
                sheetId: sheet1.properties.sheetId,
              },
            },
          ],
        }),
      });
      console.log('លុបសន្លឹកបៀរដើម Sheet1 ចេញដើម្បីភាពស្អាត (Deleted default Sheet1 for neatness)');
    } catch (e) {
      console.warn('Could not delete default Sheet1 (non-blocking):', e);
    }
  }

  // Initialize headers if sheets are empty
  await initializeHeadersIfEmpty(accessToken, spreadsheetId);
}

/**
 * Initializes the headers for the tabs if they do not contain values.
 */
async function initializeHeadersIfEmpty(accessToken: string, spreadsheetId: string): Promise<void> {
  // Unconditionally update Departures headers to the new format (without cargoType/weight)
  const depHeaders = [
    ['ID', 'ស្លាកលេខឡាន (Plate Number)', 'ឈ្មោះអ្នកបើកបរ (Driver Name)', 'ថ្ងៃម៉ោងចេញដំណើរ (Departure Date/Time)', 'កន្លែងចេញដំណើរ (Start Location)', 'គោលដៅ (End Location)', 'ស្ថានភាព (Status)', 'កំណត់សម្គាល់ (Notes)', 'ថ្ងៃបង្កើត (Created At)', 'កម្រៃជើងសារ/USD (Commission)', 'ប្រេងផ្តល់ជូន/លីត្រ (Fuel/Liters)']
  ];
  await updateSheetRange(accessToken, spreadsheetId, 'Departures!A1:K1', depHeaders);

  // Unconditionally update Trips headers
  const tripHeaders = [
    ['Trip ID', 'Departure ID', 'ស្លាកលេខឡាន (Plate Number)', 'ឈ្មោះផ្លូវ (Route Name)', 'ចម្ងាយ/គម (Distance/KM)', 'ប្រេងផ្តល់ជូន/លីត្រ (Fuel/Liters)', 'រយៈពេលប៉ាន់ស្មាន (Est Duration)', 'អ្នកគ្រប់គ្រង (Dispatcher)', 'ថ្ងៃម៉ោងទៅដល់ជាក់ស្តែង (Actual Arrival Date/Time)', 'តម្លៃឥវ៉ាន់/USD (Cargo Value)', 'ស្ថានភាព (Status)', 'កម្រៃជើងសារ/USD (Commission)']
  ];
  await updateSheetRange(accessToken, spreadsheetId, 'Trips!A1:L1', tripHeaders);

  // Check Settings headers
  const settingsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A1:A1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const settingsData = await settingsRes.json();
  if (!settingsData.values || settingsData.values.length === 0) {
    const headers = [
      ['ស្លាកលេខឡាន (Plate Number)', 'ឈ្មោះអ្នកបើកបរ (Driver Name)', 'គោលដៅ (Destination)', 'កម្រៃជើងសារ/USD (Commission)', 'ប្រេងផ្តល់ជូន/លីត្រ (Fuel/Liters)', 'តំបន់ (Zone / Area)']
    ];
    await updateSheetRange(accessToken, spreadsheetId, 'Settings!A1', headers);

    const defaultSettings: AppSettings = {
      plateNumbers: ['3A-4567', '3B-1234', '3C-8888', '2A-9999', '2B-7777'],
      driverNames: ['សុខ ជា', 'មាស ចាន់', 'កែវ វិសាល', 'ឡុង ដារ៉ា'],
      destinations: ['កំពង់សោម (Sihanoukville)', 'បាត់ដំបង (Battambang)', 'សៀមរាប (Siem Reap)', 'ប៉ោយប៉ែត (Poipet)', 'កំពត (Kampot)'],
      commissions: [20, 30, 40, 50, 60, 80, 100],
      fuelAmounts: [30, 50, 80, 100, 120, 150, 200],
      zones: ['ភ្នំពេញ (Phnom Penh)', 'កំពង់សោម (Sihanoukville)', 'សៀមរាប (Siem Reap)', 'បាត់ដំបង (Battambang)', 'កំពត (Kampot)']
    };
    const defaultRows = settingsToRows(defaultSettings);
    await updateSheetRange(accessToken, spreadsheetId, 'Settings!A2', defaultRows);
  }

  // Unconditionally update UserRoles headers
  const rolesHeaders = [
    ['Email/Username (អ៊ីមែល ឬ ឈ្មោះអ្នកប្រើ)', 'Name (ឈ្មោះ)', 'Role (សិទ្ធិ)', 'Assigned Driver (ឈ្មោះអ្នកបើកបរ)', 'Password (ពាក្យសំងាត់)']
  ];
  await updateSheetRange(accessToken, spreadsheetId, 'UserRoles!A1:E1', rolesHeaders);

  // Unconditionally update CargoBookings headers (Link Location at Column I, Photo at J)
  const bookingsHeaders = [
    ['ID (លេខរៀង)', 'Location Name (ឈ្មោះទីតាំង)', 'Phone Number (លេខទូរស័ទ្ទ)', 'Zone/Area (តំបន់)', 'Full Name (ឈ្មោះអ្នកប្រើប្រាស់)', 'Created At (ថ្ងៃបង្កើត)', 'Creator Email (អ៊ីមែលអ្នកបង្កើត)', 'Status (ស្ថានភាព)', 'Link Location (ជួលឈរ)', 'Photo (រូបភាព)']
  ];
  await updateSheetRange(accessToken, spreadsheetId, 'CargoBookings!A1:J1', bookingsHeaders);
}

/**
 * Writes raw values to a specific sheet range.
 */
async function updateSheetRange(accessToken: string, spreadsheetId: string, range: string, values: any[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    throw new Error(`មិនអាចសរសេរទិន្នន័យទៅកាន់ជួរ ${range} បានទេ (Failed to write data to range ${range})`);
  }
}

/**
 * Fetches all records from both sheets and parses them.
 */
export async function fetchSpreadsheetData(accessToken: string, spreadsheetId: string): Promise<{ departures: Departure[]; trips: Trip[]; settings?: AppSettings; userRoles?: UserRole[]; cargoBookings?: CargoBooking[] }> {
  try {
    // 1. Fetch Departures
    const depUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Departures!A2:L1000`;
    const depRes = await fetch(depUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!depRes.ok) {
      if (depRes.status === 401) {
        throw new Error('Unauthorized or expired token (401)');
      }
      throw new Error(`Failed to fetch Departures. Status: ${depRes.status}`);
    }
    const depData = await depRes.json();
    const departures: Departure[] = [];

    if (depData.values && depData.values.length > 0) {
      depData.values.forEach((row: any[]) => {
        if (row[0]) { // Check if ID exists
          const statusCandidates = ['Scheduled', 'Dispatched', 'Arrived', 'Cancelled'];
          const isNewLayout = statusCandidates.includes(row[6]) || !statusCandidates.includes(row[8]);

          if (isNewLayout) {
            departures.push({
              id: String(row[0]),
              plateNumber: String(row[1] || ''),
              driverName: String(row[2] || ''),
              departureDateTime: String(row[3] || ''),
              startLocation: String(row[4] || ''),
              endLocation: String(row[5] || ''),
              status: (row[6] || 'Scheduled') as Departure['status'],
              notes: String(row[7] || ''),
              createdAt: String(row[8] || new Date().toISOString()),
              commission: row[9] ? Number(row[9]) : undefined,
              fuelLiters: row[10] ? Number(row[10]) : undefined,
            });
          } else {
            departures.push({
              id: String(row[0]),
              plateNumber: String(row[1] || ''),
              driverName: String(row[2] || ''),
              departureDateTime: String(row[3] || ''),
              startLocation: String(row[4] || ''),
              endLocation: String(row[5] || ''),
              status: (row[8] || 'Scheduled') as Departure['status'],
              notes: String(row[9] || ''),
              createdAt: String(row[10] || new Date().toISOString()),
              commission: row[11] ? Number(row[11]) : undefined,
              cargoType: String(row[6] || ''),
              weight: Number(row[7] || 0),
            });
          }
        }
      });
    }

    // 2. Fetch Trips
    const tripUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Trips!A2:L1000`;
    const tripRes = await fetch(tripUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!tripRes.ok) {
      if (tripRes.status === 401) {
        throw new Error('Unauthorized or expired token (401)');
      }
      throw new Error(`Failed to fetch Trips. Status: ${tripRes.status}`);
    }
    const tripData = await tripRes.json();
    const trips: Trip[] = [];

    if (tripData.values && tripData.values.length > 0) {
      tripData.values.forEach((row: any[]) => {
        if (row[0]) { // Check if Trip ID exists
          trips.push({
            tripId: String(row[0]),
            departureId: String(row[1] || ''),
            plateNumber: String(row[2] || ''),
            routeName: String(row[3] || ''),
            distanceKm: Number(row[4] || 0),
            fuelAllocated: Number(row[5] || 0),
            estDuration: String(row[6] || ''),
            dispatcher: String(row[7] || ''),
            actualArrivalDateTime: row[8] ? String(row[8]) : undefined,
            cargoValue: Number(row[9] || 0),
            status: (row[10] || 'In Progress') as Trip['status'],
            commission: Number(row[11] || 0),
          });
        }
      });
    }

    // 3. Fetch Settings
    let settings: AppSettings | undefined = undefined;
    try {
      const settingsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A2:F1000`;
      const settingsRes = await fetch(settingsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!settingsRes.ok) {
        if (settingsRes.status === 401) {
          throw new Error('Unauthorized or expired token (401)');
        }
        console.warn(`Failed to fetch Settings. Status: ${settingsRes.status}`);
      } else {
        const settingsData = await settingsRes.json();
        if (settingsData.values && settingsData.values.length > 0) {
          settings = rowsToSettings(settingsData.values);
        }
      }
    } catch (e) {
      console.warn('Could not fetch settings from Google Sheets (falling back to default/local):', e);
      if (e instanceof Error && e.message.includes('401')) throw e;
    }

    // 4. Fetch UserRoles
    let userRoles: UserRole[] = [];
    try {
      const rolesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/UserRoles!A2:E1000`;
      const rolesRes = await fetch(rolesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!rolesRes.ok) {
        if (rolesRes.status === 401) {
          throw new Error('Unauthorized or expired token (401)');
        }
        console.warn(`Failed to fetch UserRoles. Status: ${rolesRes.status}`);
      } else {
        const rolesData = await rolesRes.json();
        if (rolesData.values && rolesData.values.length > 0) {
          userRoles = rolesData.values.map((row: any[]) => ({
            email: String(row[0] || '').trim(),
            name: String(row[1] || '').trim(),
            role: (row[2] || 'Standard') as 'Admin' | 'Standard',
            assignedDriver: row[3] ? String(row[3]).trim() : undefined,
            password: row[4] ? String(row[4]).trim() : undefined,
          })).filter(u => u.email !== '');
        }
      }
    } catch (e) {
      console.warn('Could not fetch user roles from Google Sheets:', e);
      if (e instanceof Error && e.message.includes('401')) throw e;
    }

    // 5. Fetch CargoBookings
    let cargoBookings: CargoBooking[] = [];
    try {
      const bookingsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CargoBookings!A2:J1000`;
      const bookingsRes = await fetch(bookingsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!bookingsRes.ok) {
        if (bookingsRes.status === 401) {
          throw new Error('Unauthorized or expired token (401)');
        }
        console.warn(`Failed to fetch CargoBookings. Status: ${bookingsRes.status}`);
      } else {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.values && bookingsData.values.length > 0) {
          cargoBookings = bookingsData.values.map((row: any[]) => ({
            id: String(row[0] || ''),
            locationName: String(row[1] || ''),
            phoneNumber: String(row[2] || ''),
            zone: String(row[3] || ''),
            userName: String(row[4] || ''),
            createdAt: String(row[5] || ''),
            creatorEmail: String(row[6] || ''),
            status: (row[7] || 'Pending') as CargoBooking['status'],
            linkLocation: String(row[8] || ''),
            photoUrl: String(row[9] || ''),
          })).filter(b => b.id !== '');
        }
      }
    } catch (e) {
      console.warn('Could not fetch cargo bookings from Google Sheets:', e);
      if (e instanceof Error && e.message.includes('401')) throw e;
    }

    return { departures, trips, settings, userRoles, cargoBookings };
  } catch (err) {
    console.error('Error in fetchSpreadsheetData:', err);
    throw err;
  }
}

/**
 * Overwrites all entries in Google Sheets with the latest local application data.
 * Clears old rows first to prevent lingering rows when deleting or reducing records.
 */
export async function syncSpreadsheetData(
  accessToken: string,
  spreadsheetId: string,
  departures: Departure[],
  trips: Trip[],
  settings?: AppSettings
): Promise<void> {
  try {
    // 1. Sync Departures
    // First clear old rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Departures!A2:L1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (departures.length > 0) {
      const depRows = departures.map((d) => [
        d.id,
        d.plateNumber,
        d.driverName,
        d.departureDateTime,
        d.startLocation,
        d.endLocation,
        d.status,
        d.notes || '',
        d.createdAt || '',
        d.commission || 0,
        d.fuelLiters || 0,
      ]);
      await updateSheetRange(accessToken, spreadsheetId, 'Departures!A2', depRows);
    }

    // 2. Sync Trips
    // First clear old rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Trips!A2:L1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (trips.length > 0) {
      const tripRows = trips.map((t) => [
        t.tripId,
        t.departureId,
        t.plateNumber,
        t.routeName,
        t.distanceKm,
        t.fuelAllocated,
        t.estDuration,
        t.dispatcher,
        t.actualArrivalDateTime || '',
        t.cargoValue || 0,
        t.status,
        t.commission || 0,
      ]);
      await updateSheetRange(accessToken, spreadsheetId, 'Trips!A2', tripRows);
    }

    // 3. Sync Settings
    if (settings) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A2:F1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const settingsRows = settingsToRows(settings);
      if (settingsRows.length > 0) {
        await updateSheetRange(accessToken, spreadsheetId, 'Settings!A2', settingsRows);
      }
    }

    console.log('ការផ្ទៀងផ្ទាត់ទិន្នន័យបានជោគជ័យ (Spreadsheet synchronization completed successfully)');
  } catch (err) {
    console.error('Error in syncSpreadsheetData:', err);
    throw err;
  }
}

/**
 * Converts AppSettings into 2D grid array rows for writing to Google Sheets.
 */
export function settingsToRows(settings: AppSettings): any[][] {
  const maxLen = Math.max(
    settings.plateNumbers?.length || 0,
    settings.driverNames?.length || 0,
    settings.destinations?.length || 0,
    settings.commissions?.length || 0,
    settings.fuelAmounts?.length || 0,
    settings.zones?.length || 0
  );

  const rows: any[][] = [];
  for (let i = 0; i < maxLen; i++) {
    rows.push([
      settings.plateNumbers[i] !== undefined ? settings.plateNumbers[i] : '',
      settings.driverNames[i] !== undefined ? settings.driverNames[i] : '',
      settings.destinations[i] !== undefined ? settings.destinations[i] : '',
      settings.commissions[i] !== undefined ? settings.commissions[i] : '',
      settings.fuelAmounts[i] !== undefined ? settings.fuelAmounts[i] : '',
      settings.zones && settings.zones[i] !== undefined ? settings.zones[i] : '',
    ]);
  }
  return rows;
}

/**
 * Converts 2D grid array rows from Google Sheets back into AppSettings object.
 */
export function rowsToSettings(rows: any[][]): AppSettings {
  const plateNumbers: string[] = [];
  const driverNames: string[] = [];
  const destinations: string[] = [];
  const commissions: number[] = [];
  const fuelAmounts: number[] = [];
  const zones: string[] = [];

  rows.forEach((row) => {
    if (row[0] !== undefined && String(row[0]).trim() !== '') {
      plateNumbers.push(String(row[0]).trim());
    }
    if (row[1] !== undefined && String(row[1]).trim() !== '') {
      driverNames.push(String(row[1]).trim());
    }
    if (row[2] !== undefined && String(row[2]).trim() !== '') {
      destinations.push(String(row[2]).trim());
    }
    if (row[3] !== undefined && String(row[3]).trim() !== '' && !isNaN(Number(row[3]))) {
      commissions.push(Number(row[3]));
    }
    if (row[4] !== undefined && String(row[4]).trim() !== '' && !isNaN(Number(row[4]))) {
      fuelAmounts.push(Number(row[4]));
    }
    if (row[5] !== undefined && String(row[5]).trim() !== '') {
      zones.push(String(row[5]).trim());
    }
  });

  return {
    plateNumbers,
    driverNames,
    destinations,
    commissions: commissions.sort((a, b) => a - b),
    fuelAmounts: fuelAmounts.sort((a, b) => a - b),
    zones,
  };
}

/**
 * Overwrites all entries in Google Sheets with the latest user roles.
 */
export async function syncUserRolesData(
  accessToken: string,
  spreadsheetId: string,
  userRoles: UserRole[]
): Promise<void> {
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/UserRoles!A2:E1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userRoles.length > 0) {
      const rows = userRoles.map((u) => [
        u.email,
        u.name,
        u.role,
        u.assignedDriver || '',
        u.password || '',
      ]);
      await updateSheetRange(accessToken, spreadsheetId, 'UserRoles!A2', rows);
    }
  } catch (err) {
    console.error('Error in syncUserRolesData:', err);
    throw err;
  }
}

/**
 * Overwrites all entries in Google Sheets with the latest cargo bookings.
 */
export async function syncCargoBookingsData(
  accessToken: string,
  spreadsheetId: string,
  cargoBookings: CargoBooking[]
): Promise<void> {
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/CargoBookings!A2:J1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (cargoBookings.length > 0) {
      const rows = cargoBookings.map((b) => [
        b.id,
        b.locationName,
        b.phoneNumber,
        b.zone,
        b.userName,
        b.createdAt,
        b.creatorEmail,
        b.status,
        b.linkLocation || '',
        b.photoUrl || '',
      ]);
      await updateSheetRange(accessToken, spreadsheetId, 'CargoBookings!A2', rows);
    }
  } catch (err) {
    console.error('Error in syncCargoBookingsData:', err);
    throw err;
  }
}

/**
 * Uploads a file (photo) to Google Drive and returns its public sharing view link.
 */
export async function uploadFileToDrive(accessToken: string, file: File): Promise<string> {
  const metadata = {
    name: `completion-photo-${Date.now()}-${file.name}`,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload file to Google Drive: ${errText}`);
  }

  const data = await res.json();
  
  // Try to create public permission so anyone with link can view it
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (e) {
    console.warn('Failed to set public view permission:', e);
  }

  return data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
}
