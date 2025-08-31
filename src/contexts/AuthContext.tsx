import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
  UserCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  continueAsGuest: () => void;
  resetGuestState: () => void;
  clearError: () => void;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app and provides auth context
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false); // User is authenticated, not a guest
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setIsGuest(false); // User is no longer a guest
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        // Fallback for non-Firebase errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  // Signup function
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setIsGuest(false); // User is no longer a guest
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        // Fallback for non-Firebase errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
      setIsGuest(false); // Reset guest state on logout
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        // Fallback for non-Firebase errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        // Fallback for non-Firebase errors
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  // Continue as guest function
  const continueAsGuest = () => {
    setIsGuest(true);
    setError(null);
  };

  // Reset guest state function
  const resetGuestState = () => {
    setIsGuest(false);
    setError(null);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    isGuest,
    login,
    signup,
    logout,
    forgotPassword,
    continueAsGuest,
    resetGuestState,
    clearError,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials.';
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please log in again.';
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different user account.';
    case 'auth/timeout':
      return 'Request timed out. Please try again.';
    case 'auth/quota-exceeded':
      return 'Quota exceeded. Please try again later.';
    default:
      return `Authentication error: ${errorCode}`;
  }
};
