import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { getDeviceId } from '../services/device';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        setToken(storedToken);
        const profile = await authAPI.getProfile();
        setUser(profile);
      }
    } catch {
      await SecureStore.deleteItemAsync('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const deviceId = await getDeviceId();
    const data = await authAPI.login(email, password, deviceId);

    const newToken = data.token || data;
    await SecureStore.setItemAsync('authToken', newToken);
    setToken(newToken);

    const profile = await authAPI.getProfile();
    setUser(profile);

    return profile;
  }

  async function logout() {
    await SecureStore.deleteItemAsync('authToken');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
