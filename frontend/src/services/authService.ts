import api from './api';
import { SessionPayload, User, UserRole } from '../types';

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export async function signIn(email: string, password: string): Promise<User> {
  await api.post('/auth/sign-in/email', {
    email,
    password,
  });
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unable to fetch session after sign-in');
  }
  return session.user;
}

export async function signUp(payload: SignUpPayload): Promise<User> {
  await api.post('/auth/sign-up/email', {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    role: payload.role,
    phone: payload.phone,
  });
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unable to fetch session after sign-up');
  }
  return session.user;
}

export async function signOut() {
  await api.post('/auth/sign-out');
}

export async function getSession(): Promise<SessionPayload | null> {
  const response = await api.get<SessionPayload | null>('/auth/get-session');
  return response.data;
}
