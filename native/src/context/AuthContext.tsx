import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSession, signIn, signOut, signUp } from '../services/authService';
import { User, UserRole } from '../types';

const SESSION_KEY = 'geobites_session';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return;
      }

      const cached = await AsyncStorage.getItem(SESSION_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { user: User };
        setUser(parsed.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    void (async () => {
      await refreshSession();
      setIsLoading(false);
    })();
  }, []);

  const signInUser = async (email: string, password: string) => {
    const signedInUser = await signIn(email, password);
    setUser(signedInUser);
  };

  const signUpUser = async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
  }) => {
    const createdUser = await signUp(payload);
    setUser(createdUser);
  };

  const signOutUser = async () => {
    await signOut();
    setUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      signIn: signInUser,
      signUp: signUpUser,
      signOut: signOutUser,
      refreshSession,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
