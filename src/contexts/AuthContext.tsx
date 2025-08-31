import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
  UserCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  ActionCodeInfo
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { UserService, CreateUserProfileData } from '../services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, profileData?: CreateUserProfileData) => Promise<UserCredential>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (actionCode: string) => Promise<void>;
  refreshUserVerificationStatus: () => Promise<void>;
  continueAsGuest: () => void;
  resetGuestState: () => void;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuest(false);
        setIsEmailVerified(user.emailVerified);
      } else {
        setIsEmailVerified(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setIsGuest(false);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setIsEmailVerified(result.user.emailVerified);
      return result;
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, profileData?: CreateUserProfileData): Promise<UserCredential> => {
    try {
      setError(null);
      setIsGuest(false);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email after successful signup
      if (result.user) {
        await sendEmailVerification(result.user);
        setIsEmailVerified(false);
        
        // Create user profile in Firestore if profile data is provided
        if (profileData) {
          try {
            await UserService.createUserProfile(result.user.uid, {
              ...profileData,
              email: result.user.email || email,
            });
          } catch (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't throw error here as the user account was created successfully
            // The profile can be created later
          }
        }
      }
      
      return result;
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
      setIsGuest(false);
      setIsEmailVerified(false);
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

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
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const sendVerificationEmail = async (): Promise<void> => {
    try {
      setError(null);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const verifyEmail = async (actionCode: string): Promise<void> => {
    try {
      setError(null);
      await applyActionCode(auth, actionCode);
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const refreshUserVerificationStatus = async (): Promise<void> => {
    try {
      setError(null);
      if (auth.currentUser) {
        // Force reload the user object to get the latest verification status
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser);
        setIsEmailVerified(updatedUser.emailVerified);
      }
    } catch (error) {
      const authError = error as AuthError;
      if (authError && authError.code) {
        const errorMessage = getAuthErrorMessage(authError.code);
        setError(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      }
      throw error;
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setError(null);
  };

  const resetGuestState = () => {
    setIsGuest(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isGuest,
    isEmailVerified,
    login,
    signup,
    logout,
    forgotPassword,
    sendVerificationEmail,
    verifyEmail,
    refreshUserVerificationStatus,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found': return 'No account found with this email address.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password should be at least 6 characters long.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Network error. Please check your connection.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/operation-not-allowed': return 'This operation is not allowed.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/account-exists-with-different-credential': return 'An account already exists with the same email address but different sign-in credentials.';
    case 'auth/requires-recent-login': return 'This operation requires recent authentication. Please log in again.';
    case 'auth/credential-already-in-use': return 'This credential is already associated with a different user account.';
    case 'auth/timeout': return 'Request timed out. Please try again.';
    case 'auth/quota-exceeded': return 'Quota exceeded. Please try again later.';
    case 'auth/invalid-action-code': return 'Invalid verification code. Please request a new one.';
    case 'auth/expired-action-code': return 'Verification code has expired. Please request a new one.';
    default: return `Authentication error: ${errorCode}`;
  }
};
