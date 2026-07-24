import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser, updateCurrentUser } from '../api/auth.js';
import { getApiErrorMessage, getToken, setToken } from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session
  const { showToast } = useToast();

  // On first load, if a token is already stored, validate it and hydrate the user.
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        // Token expired/invalid - clear it silently
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      try {
        const data = await loginUser({ email, password });
        setToken(data.access_token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return { success: true };
      } catch (error) {
        const message = getApiErrorMessage(error, 'Incorrect email or password');
        showToast(message, 'error');
        return { success: false, message };
      }
    },
    [showToast]
  );

  const register = useCallback(
    async (payload) => {
      try {
        const data = await registerUser(payload);
        setToken(data.access_token);
        setUser(data.user);
        showToast(`Account created. Welcome, ${data.user.name}!`, 'success');
        return { success: true };
      } catch (error) {
        const message = getApiErrorMessage(error, 'Could not create your account');
        showToast(message, 'error');
        return { success: false, message };
      }
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    showToast('You have been logged out', 'info');
  }, [showToast]);

  const updateProfile = useCallback(
    async (payload) => {
      try {
        const updatedUser = await updateCurrentUser(payload);
        setUser(updatedUser);
        showToast('Profile updated successfully!', 'success');
        return { success: true };
      } catch (error) {
        const message = getApiErrorMessage(error, 'Could not update profile');
        showToast(message, 'error');
        return { success: false, message };
      }
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      register,
      logout,
      updateProfile
    }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
