import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthStatusResponse,
  OfficerSessionInfo,
  fetchAuthStatus,
  loginOfficer,
  logoutOfficer,
  setupOfficerAccount,
} from '../services/api';

interface AuthContextValue {
  token: string | null;
  officer: OfficerSessionInfo | null;
  isAuthenticated: boolean;
  authStatus: AuthStatusResponse | null;
  loadingAuth: boolean;
  refreshAuthStatus: () => Promise<void>;
  signIn: (payload: {
    employeeId: string;
    password: string;
    officerName?: string;
    designation?: string;
  }) => Promise<void>;
  claimFirstRunAccess: (payload: {
    employeeId: string;
    officerName: string;
    designation: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Session token is held strictly in React memory (never persisted to localStorage/sessionStorage)
  const [token, setToken] = useState<string | null>(null);
  const [officer, setOfficer] = useState<OfficerSessionInfo | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const refreshAuthStatus = useCallback(async () => {
    try {
      const status = await fetchAuthStatus();
      setAuthStatus(status);
    } catch {
      setAuthStatus({ envConfigured: false, claimed: false, claimedEmployeeId: null });
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthStatus();
  }, [refreshAuthStatus]);

  const signIn = useCallback(
    async (payload: {
      employeeId: string;
      password: string;
      officerName?: string;
      designation?: string;
    }) => {
      const resp = await loginOfficer(payload);
      setToken(resp.token);
      setOfficer(resp.officer);
    },
    []
  );

  const claimFirstRunAccess = useCallback(
    async (payload: {
      employeeId: string;
      officerName: string;
      designation: string;
      password: string;
    }) => {
      const resp = await setupOfficerAccount(payload);
      setToken(resp.token);
      setOfficer(resp.officer);
      await refreshAuthStatus();
    },
    [refreshAuthStatus]
  );

  const signOut = useCallback(async () => {
    const current = token;
    setToken(null);
    setOfficer(null);
    await logoutOfficer(current);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        officer,
        isAuthenticated: Boolean(token && officer),
        authStatus,
        loadingAuth,
        refreshAuthStatus,
        signIn,
        claimFirstRunAccess,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
