import { useAuth } from '@clerk/clerk-react';
import React from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// UPDATED: Admin check with authentication
export const checkAdminStatus = async (user, getToken) => {
  if (!user || !user.id) {
    console.log('❌ No user provided for admin check');
    return { isAdmin: false, agency: null, error: 'No user provided' };
  }

  try {
    console.log('🔍 Checking admin status for user:', user.id);
    
    // GET AUTHENTICATION TOKEN
    if (!getToken) {
      console.error('❌ getToken function not provided');
      return { isAdmin: false, agency: null, error: 'Authentication not available' };
    }

    const token = await getToken();
    
    if (!token) {
      console.error('❌ Failed to get authentication token');
      return { isAdmin: false, agency: null, error: 'Authentication failed' };
    }

    console.log('🔐 Token obtained, making authenticated request...');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/check-admin-status/${user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // CRITICAL: Add auth header
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Admin check response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin status response:', data);
      
      if (data.success) {
        return {
          isAdmin: data.isAdmin,
          agency: data.agency,
          message: data.message || 'Admin status retrieved'
        };
      } else {
        return {
          isAdmin: false,
          agency: null,
          error: data.error || 'Admin check failed'
        };
      }
    } else if (response.status === 401) {
      console.error('❌ Authentication failed for admin check');
      return { isAdmin: false, agency: null, error: 'Authentication failed' };
    } else if (response.status === 403) {
      console.error('❌ Access denied for admin check');
      return { isAdmin: false, agency: null, error: 'Access denied' };
    } else {
      console.error('❌ API response not OK:', response.status, response.statusText);
      return { 
        isAdmin: false, 
        agency: null, 
        error: `API error: ${response.status}` 
      };
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return { 
      isAdmin: false, 
      agency: null, 
      error: error.message || 'Network error' 
    };
  }
};

// UPDATED: Cached admin check with authentication
export const getCachedAdminStatus = async (user, getToken, maxAge = 300000) => { // 5 minutes cache
  if (!user || !user.id) {
    return { isAdmin: false, agency: null, error: 'No user provided' };
  }

  const cacheKey = `admin_status_${user.id}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < maxAge) {
        console.log(`💾 Using cached admin status (age: ${Math.floor(age / 1000)} seconds)`);
        return data;
      } else {
        console.log('🗑️ Cache expired, fetching fresh data');
        sessionStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.log('❌ Invalid cache data, removing');
      sessionStorage.removeItem(cacheKey);
    }
  }

  // Fetch fresh data with authentication
  const result = await checkAdminStatus(user, getToken);
  
  // Only cache successful results
  if (!result.error) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
      console.log('💾 Cached fresh admin status');
    } catch (e) {
      console.log('❌ Failed to cache admin status');
    }
  }

  return result;
};

// UPDATED: React hook for admin status with authentication
export const useAdminStatus = (user) => {
  const { getToken } = useAuth();
  const [adminStatus, setAdminStatus] = React.useState({
    isAdmin: false,
    agency: null,
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!user?.id || !getToken) {
        setAdminStatus({
          isAdmin: false,
          agency: null,
          isLoading: false,
          error: 'User not available'
        });
        return;
      }

      try {
        setAdminStatus(prev => ({ ...prev, isLoading: true, error: null }));
        
        const result = await getCachedAdminStatus(user, getToken);
        
        if (isMounted) {
          setAdminStatus({
            isAdmin: result.isAdmin,
            agency: result.agency,
            isLoading: false,
            error: result.error || null
          });
        }
      } catch (error) {
        if (isMounted) {
          setAdminStatus({
            isAdmin: false,
            agency: null,
            isLoading: false,
            error: error.message || 'Failed to check admin status'
          });
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.id, getToken]);

  return adminStatus;
};

// UPDATED: Clear admin cache when needed
export const clearAdminCache = (userId) => {
  if (userId) {
    const cacheKey = `admin_status_${userId}`;
    sessionStorage.removeItem(cacheKey);
    console.log('🗑️ Cleared admin cache for user:', userId);
  } else {
    // Clear all admin caches
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('admin_status_')) {
        keys.push(key);
      }
    }
    keys.forEach(key => sessionStorage.removeItem(key));
    console.log('🗑️ Cleared all admin caches');
  }
};

// UPDATED: Simplified admin check for components that don't need caching
export const quickAdminCheck = async (user, getToken) => {
  if (!user?.id || !getToken) {
    return false;
  }

  try {
    const token = await getToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE_URL}/api/admin/check-admin-status/${user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.success && data.isAdmin;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Quick admin check failed:', error);
    return false;
  }
};

export default {
  checkAdminStatus,
  getCachedAdminStatus,
  useAdminStatus,
  clearAdminCache,
  quickAdminCheck
};
