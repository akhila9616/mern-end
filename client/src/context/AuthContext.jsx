import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('taskflow_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('taskflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          // Backend might return user object directly or { user: ... }
          const userData = res.data?.user || res.data;
          setUser(userData);
          localStorage.setItem('taskflow_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('token');
          localStorage.removeItem('taskflow_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const authToken = res.data?.token;
      const userData = res.data?.user || res.data;

      if (authToken) {
        localStorage.setItem('taskflow_token', authToken);
        localStorage.setItem('token', authToken);
        setToken(authToken);
      }

      if (userData) {
        localStorage.setItem('taskflow_user', JSON.stringify(userData));
        setUser(userData);
      }

      toast.success(res.data?.message || `Welcome back, ${userData?.name || 'User'}!`);
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const authToken = res.data?.token;
      const userData = res.data?.user || res.data;

      if (authToken) {
        localStorage.setItem('taskflow_token', authToken);
        localStorage.setItem('token', authToken);
        setToken(authToken);
      }

      if (userData) {
        localStorage.setItem('taskflow_user', JSON.stringify(userData));
        setUser(userData);
      }

      toast.success(res.data?.message || 'Account created successfully!');
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('token');
    localStorage.removeItem('taskflow_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('taskflow_user', JSON.stringify(userData));
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
