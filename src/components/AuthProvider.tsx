'use client';

import React, { createContext, useContext } from 'react';
import { authClient } from '@/lib/auth-client';

type LuminaAuthClient = typeof authClient;

const LuminaAuthClientContext = createContext<LuminaAuthClient>(authClient);

interface LuminaAuthProviderProps {
  children: React.ReactNode;
}

// Keep provider value stable to avoid unnecessary app-wide re-renders.
export function LuminaAuthProvider({ children }: LuminaAuthProviderProps) {
  return (
    <LuminaAuthClientContext.Provider value={authClient}>
      {children}
    </LuminaAuthClientContext.Provider>
  );
}

export function useLuminaAuthClient() {
  return useContext(LuminaAuthClientContext);
}
