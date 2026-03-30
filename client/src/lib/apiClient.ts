import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // DIAGNOSTIC LOOP: Log token expiration every 5 minutes if it hasn't been logged recently
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          if (payload && payload.exp) {
            const expTime = new Date(payload.exp * 1000);
            const now = new Date();
            const minutesLeft = Math.round((expTime.getTime() - now.getTime()) / 60000);
            
            // Only log if it's nearing expiration or for initial diagnosis
            if (minutesLeft < 60 || ! (window as any)._lastTokenLog) {
              console.info(`[Auth Diagnostic] Token expires at: ${expTime.toLocaleString()} (${minutesLeft} minutes left)`);
              (window as any)._lastTokenLog = Date.now();
            }
          }
        }
      } catch (e) {
        // Silent fail on diagnostic log
      }
    }
    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out...', {
        url: error.config?.url,
        message: error.response?.data?.message || 'No message provided'
      });
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

