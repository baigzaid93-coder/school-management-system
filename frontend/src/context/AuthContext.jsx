import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    const savedSchoolId = localStorage.getItem('currentSchoolId');
    const savedSchoolData = localStorage.getItem('schoolData');
    const savedUserData = localStorage.getItem('userData');
    
    if (token) {
      try {
        const response = await api.get('/auth/me');
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        if (userData.isSuperAdmin && savedSchoolId) {
          try {
            let schoolData = null;
            
            if (savedSchoolData) {
              try {
                schoolData = JSON.parse(savedSchoolData);
              } catch (e) {
                schoolData = null;
              }
            }
            
            if (!schoolData) {
              const schoolRes = await api.get(`/schools/${savedSchoolId}`);
              schoolData = schoolRes.data;
              localStorage.setItem('schoolData', JSON.stringify(schoolData));
            }
            
            if (schoolData && schoolData._id) {
              setCurrentSchool(schoolData);
            }
          } catch (schoolError) {
            console.warn('Failed to load school data:', schoolError.message);
            setCurrentSchool({ _id: savedSchoolId, name: 'Loading...' });
          }
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentSchoolId');
        localStorage.removeItem('schoolData');
        setUser(null);
        setCurrentSchool(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userData', JSON.stringify(user));
      
      setUser(user);
      
      // If Super Admin, try to load their first school
      if (user.isSuperAdmin) {
        const schoolsRes = await api.get('/schools');
        if (schoolsRes.data.length > 0) {
          setCurrentSchool(schoolsRes.data[0]);
          localStorage.setItem('currentSchoolId', schoolsRes.data[0]._id);
        }
      } else if (user.school) {
        // For school admins, set the school ID from user data
        localStorage.setItem('currentSchoolId', user.school);
        setCurrentSchool({ _id: user.school, name: user.schoolName || 'School' });
      }
      
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { user, accessToken, refreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentSchoolId');
      localStorage.removeItem('schoolData');
      localStorage.removeItem('userData');
      setUser(null);
      setCurrentSchool(null);
    }
  };

  const switchSchool = (school) => {
    localStorage.setItem('currentSchoolId', school._id);
    setCurrentSchool(school);
    localStorage.setItem('schoolData', JSON.stringify(school));
  };

  const clearSchool = () => {
    setCurrentSchool(null);
    localStorage.removeItem('currentSchoolId');
    localStorage.removeItem('schoolData');
  };

  const hasPermission = (permission) => {
    if (!user?.role?.permissions) return false;
    const userPermissions = user.role.permissions;
    
    if (userPermissions.includes('*')) return true;
    
    const perms = Array.isArray(permission) ? permission : [permission];
    
    return perms.some(perm => {
      if (userPermissions.includes(perm)) return true;
      if (typeof perm === 'string' && perm.includes(':')) {
        const [module] = perm.split(':');
        return userPermissions.includes(`${module}:*`);
      }
      return false;
    });
  };

  const hasRole = (...roles) => {
    if (!user?.role?.code) return false;
    return roles.includes(user.role.code);
  };

  const value = {
    user,
    currentSchool,
    loading,
    error,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    checkAuth,
    switchSchool,
    clearSchool
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
