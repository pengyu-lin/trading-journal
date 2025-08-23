import type { User } from "firebase/auth";

// Authentication state interface
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
}

// Registration form data
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// User profile data (extended from Firebase User)
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}
