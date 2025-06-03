import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set display name
    await updateProfile(user, {
      displayName
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: user.photoURL,
      role: 'user',
      teams: [],
      subscription: 'free',
      subscriptionStatus: 'active',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return user;
  } catch (error) {
    console.error("Error in signup:", error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp()
    });
    
    return user;
  } catch (error) {
    console.error("Error in signin:", error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error in signout:", error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error in reset password:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (user: User, data: { displayName?: string; photoURL?: string }) => {
  try {
    // Update in Firebase Auth
    await updateProfile(user, data);
    
    // Update in Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};