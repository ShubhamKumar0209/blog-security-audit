import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the failed request was the refresh or login endpoint itself
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh token using the HttpOnly cookie
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        
        // Save new access token
        localStorage.setItem('token', data.token);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, token is truly expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile')
};

// Posts API
export const postsAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/posts?page=${page}&limit=${limit}`),
  getOne: (id) => api.get(`/posts/${id}`),
  search: (q) => api.get(`/posts/search?q=${encodeURIComponent(q)}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`)
};

// Comments API
export const commentsAPI = {
  getByPost: (postId) => api.get(`/comments/${postId}`),
  create: (postId, data) => api.post(`/comments/${postId}`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`)
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  deletePost: (id) => api.delete(`/admin/posts/${id}`),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
  info: () => api.get('/info')
};

export default api;
