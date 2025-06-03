import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  Auth, // Import Auth type
  UserCredential, // Import UserCredential
  ActionCodeSettings // Import ActionCodeSettings
} from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase-config'; // Rename import to avoid conflict, ensure it's typed in firebase-config.ts

interface UpdateProfileData {
  displayName?: string | null;
  photoURL?: string | null;
}

interface FirebaseAuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password?: string) => Promise<UserCredential>;
  signIn: (email: string, password?: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string, actionCodeSettings?: ActionCodeSettings) => Promise<void>;
  updateUserProfile: (profileData: UpdateProfileData) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authInstance = firebaseAuth as Auth; // Cast to Auth type

  useEffect(() => {
    if (!authInstance) {
      console.error('Firebase auth is not initialized. Check firebase-config.ts and environment variables.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        console.log('Firebase Auth: User signed in:', user.uid);
      } else {
        console.log('Firebase Auth: User signed out.');
      }
    });

    return () => unsubscribe();
  }, [authInstance]);

  const signOut = async () => {
    if (!authInstance) {
      console.error('Firebase auth is not initialized.');
      return Promise.reject(new Error('Firebase auth not initialized'));
    }
    try {
      await firebaseSignOut(authInstance);
    } catch (error) {
      console.error('Error signing out with Firebase:', error);
      throw error;
    }
  };

  const signUpUser = (email: string, password?: string) => {
    if (!authInstance) return Promise.reject(new Error('Firebase auth not initialized'));
    return createUserWithEmailAndPassword(authInstance, email, password || ''); // Provide a default for password if undefined
  };

  const signInUser = (email: string, password?: string) => {
    if (!authInstance) return Promise.reject(new Error('Firebase auth not initialized'));
    return signInWithEmailAndPassword(authInstance, email, password || ''); // Provide a default for password if undefined
  };

  const resetUserPassword = (email: string, actionCodeSettings?: ActionCodeSettings) => {
    if (!authInstance) return Promise.reject(new Error('Firebase auth not initialized'));
    return sendPasswordResetEmail(authInstance, email, actionCodeSettings);
  };

  const updateUserProfileData = (profileData: UpdateProfileData) => {
    if (!authInstance || !authInstance.currentUser) {
      return Promise.reject(new Error('Firebase auth not initialized or no current user.'));
    }
    return updateProfile(authInstance.currentUser, profileData);
  };

  const value = {
    currentUser,
    loading,
    signUp: signUpUser,
    signIn: signInUser,
    signOut,
    sendPasswordResetEmail: resetUserPassword,
    updateUserProfile: updateUserProfileData,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
};
