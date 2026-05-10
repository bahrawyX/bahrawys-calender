'use client';

import { useMemo } from 'react';
import { useLuminaAuthClient } from '@/components/AuthProvider';

export function useUser() {
  const client = useLuminaAuthClient();
  const { data, isPending, isRefetching, error, refetch } = client.useSession();

  return useMemo(() => {
    const user = data?.user ?? null;
    const session = data?.session ?? null;

    return {
      user,
      session,
      isLoading: isPending,
      isRefetching,
      isAuthenticated: Boolean(user && session),
      error,
      refetch,
    };
  }, [data, isPending, isRefetching, error, refetch]);
}
