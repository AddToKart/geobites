import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User, UserRole } from '../types';

const SESSION_KEY = 'geobites_session';

interface SessionPayload {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user: User;
}

export async function signIn(email: string, password: string): Promise<User> {
  await api.post('/auth/sign-in/email', { email, password });
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unable to fetch session after sign-in');
  }
  return session.user;
}

export async function signUp(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}): Promise<User> {
  await api.post('/auth/sign-up/email', payload);
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unable to fetch session after sign-up');
  }
  return session.user;
}

export async function signOut(): Promise<void> {
  await api.post('/auth/sign-out');
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getSession(): Promise<SessionPayload | null> {
  const response = await api.get<SessionPayload | null>('/auth/get-session');
  if (response.data?.user) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(response.data));
    return response.data;
  }

  const cached = await AsyncStorage.getItem(SESSION_KEY);
  if (cached) {
    return JSON.parse(cached) as SessionPayload;
  }

  return null;
}
