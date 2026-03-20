import { useCallback, useState } from 'react';

export function useApi<TArgs extends unknown[], TData>(
  apiFn: (...args: TArgs) => Promise<TData>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TData> => {
      setIsLoading(true);
      setError(null);
      try {
        return await apiFn(...args);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : 'Unexpected error';
        setError(message);
        throw caughtError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFn],
  );

  return { execute, isLoading, error };
}
