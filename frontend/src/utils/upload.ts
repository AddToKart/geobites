import { AUTH_BASE_URL } from './constants';

export function uploadUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${AUTH_BASE_URL}${path}`;
  return path;
}
