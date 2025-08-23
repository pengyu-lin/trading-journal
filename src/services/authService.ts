import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User, UserCredential } from "firebase/auth";
import { auth } from "../config/firebase";
import type { LoginFormData, RegisterFormData } from "../types/auth";

// Sign in with email and password
export const signIn = async (
  credentials: LoginFormData
): Promise<UserCredential> => {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    return result;
  } catch (error) {
    throw new Error(
      `Login failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Create new user account
export const signUp = async (
  credentials: RegisterFormData
): Promise<UserCredential> => {
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    return result;
  } catch (error) {
    throw new Error(
      `Registration failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Sign out current user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(
      `Sign out failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to authentication state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
