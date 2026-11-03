import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUi } from '@/store/uiStore';
import { authApi } from '@/api/services';
import type { AuthPayload } from '@/api/types';

export const useAuth = () => {
  const { user, accessToken, refreshToken, setSession, clear, setUser } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const onAuthenticated = useCallback(
    (p: AuthPayload) => {
      setSession(p.accessToken, p.refreshToken, p.user);
      qc.invalidateQueries();
    },
    [qc, setSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(refreshToken);
    } catch {
      /* ignore */
    }
    clear();
    qc.clear();
    navigate('/');
  }, [clear, navigate, qc, refreshToken]);

  return {
    user,
    isAuthenticated: Boolean(accessToken && user),
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'business_owner' || user?.role === 'admin',
    onAuthenticated,
    logout,
    setUser,
  };
};

/** Returns a guard: run(fn) executes fn if signed in, otherwise opens the login prompt. */
export const useRequireAuth = () => {
  const isAuth = useAuthStore((s) => Boolean(s.accessToken && s.user));
  const open = useUi((s) => s.openLoginPrompt);
  const location = useLocation();
  return useCallback(
    (fn?: () => void, redirect?: string) => {
      if (isAuth) {
        fn?.();
        return true;
      }
      open(redirect || location.pathname + location.search);
      return false;
    },
    [isAuth, open, location]
  );
};
