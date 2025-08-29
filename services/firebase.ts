import { initializeApp, getApps } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase if it hasn't been initialized yet
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

// Export Firestore instance
export const db = firestore();

// Export Auth instance
export const authentication = auth();

/**
 * Signs in the user anonymously if not already authenticated
 * @returns Promise<string> - The user's UID
 */
export const signInAnonymously = async (): Promise<string> => {
  try {
    const userCredential = await authentication.signInAnonymously();
    return userCredential.user.uid;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

/**
 * Gets the current user's UID
 * @returns string | null - The current user's UID or null if not authenticated
 */
export const getCurrentUserUID = (): string | null => {
  const currentUser = authentication.currentUser;
  return currentUser ? currentUser.uid : null;
};

/**
 * Ensures the user is authenticated (signs in anonymously if needed)
 * @returns Promise<string> - The user's UID
 */
export const ensureAuthenticated = async (): Promise<string> => {
  const currentUID = getCurrentUserUID();
  
  if (currentUID) {
    return currentUID;
  }
  
  return await signInAnonymously();
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await authentication.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Listener for authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return authentication.onAuthStateChanged(callback);
};