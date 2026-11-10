import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { api, setStoredToken, clearStoredToken, getStoredToken } from '../services/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import { googleProvider, testFirebaseConnection } from '../services/firebase';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  firebaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);

  // Test Firestore connection on mount
  useEffect(() => {
    testFirebaseConnection().then(setFirebaseConnected).catch(() => setFirebaseConnected(false));
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      if (getStoredToken()) {
        const res = await api.getNotifications();
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Quiet fail if not logged in
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      await refreshNotifications();
    } catch (err) {
      console.warn('Failed to restore session:', err);
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  // Sync application state with Firebase onAuthStateChanged across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser && currentFirebaseUser.email) {
        try {
          const res = await api.firebaseLogin({
            email: currentFirebaseUser.email,
            uid: currentFirebaseUser.uid,
            fullName: currentFirebaseUser.displayName || currentFirebaseUser.email.split('@')[0],
            avatarUrl: currentFirebaseUser.photoURL || null,
          });
          setStoredToken(res.token);
          setUser(res.user);
          await refreshNotifications();
        } catch (err) {
          console.error('Failed to sync Firebase user session:', err);
          const token = getStoredToken();
          if (token) {
            await refreshUser();
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Fallback to local session token if logged in via standard login/demo
        const token = getStoredToken();
        if (token) {
          await refreshUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [refreshNotifications, refreshUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      setUser(res.user);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setStoredToken(res.token);
      setUser(res.user);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      setStoredToken(res.token);
      setUser(res.user);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const res = await api.firebaseLogin({
        email: fbUser.email || '',
        uid: fbUser.uid,
        fullName: fbUser.displayName || 'Google User',
        avatarUrl: fbUser.photoURL,
      });
      setStoredToken(res.token);
      setUser(res.user);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      await signOut(auth);
    } catch {
      // Ignore network errors on logout
    } finally {
      clearStoredToken();
      setUser(null);
      setFirebaseUser(null);
      setUnreadCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        register,
        demoLogin,
        loginWithGoogle,
        logout,
        refreshUser,
        unreadCount,
        refreshNotifications,
        firebaseConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
