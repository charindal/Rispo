import axios from 'axios';

// Setup axios interceptors to automatically add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem('user');
      console.log('Interceptor - user string from localStorage:', userStr ? 'EXISTS' : 'NULL');
      
      if (!userStr) {
        console.warn('No user data in localStorage for request:', config.url);
        return config;
      }
      
      const user = JSON.parse(userStr);
      console.log('Interceptor - parsed user:', { hasToken: !!user.token, username: user.username });
      
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log('✅ Added auth token to request:', config.url);
      } else {
        console.warn('❌ User data exists but no token found for request:', config.url);
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Setup response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.error('Unauthorized request - redirecting to login');
      // Redirect to login on 401
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axios;
