import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive and Sheets scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Persistent and in-memory cache for the OAuth access token
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem('truck_dispatch_google_access_token');
  } catch (e) {
    return null;
  }
})();
let isSigningIn = false;

/**
 * Initializes the auth listener to monitor authentication states.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in but no token cached (e.g. after refresh), the user needs to sign in again to get the token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Executes the Google Sign-In Popup to authenticate the user and obtain Workspace tokens.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('មិនអាចទទួលបាន Access Token ពី Google Auth បានទេ (Failed to get access token)');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('truck_dispatch_google_access_token', cachedAccessToken);
    } catch (e) {
      console.error('Failed to save access token to localStorage:', e);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('កំហុសពេលចូលគណនី (Sign in error):', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the currently cached access token.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Logs out the user and clears the token cache.
 */
export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem('truck_dispatch_google_access_token');
  } catch (e) {
    console.error('Failed to remove access token from localStorage:', e);
  }
};
