import {
  useCallback,
  PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSession, signIn, signOut, signUp, SignUpPayload } from '../services/authService';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshSession();
      setIsLoading(false);
    })();
  }, [refreshSession]);

  const signInUser = useCallback(async (email: string, password: string) => {
    const signedInUser = await signIn(email, password);
    setUser(signedInUser);
  }, []);

  const signUpUser = useCallback(async (payload: SignUpPayload) => {
    const createdUser = await signUp(payload);
    setUser(createdUser);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      signIn: signInUser,
      signUp: signUpUser,
      signOut: signOutUser,
      refreshSession,
    }),
    [isLoading, refreshSession, signInUser, signOutUser, signUpUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
