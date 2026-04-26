import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ef_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ef_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  signup: (d: { name: string; email: string; password: string; role?: string }) => api.post('/auth/signup', d),
  login: (d: { email: string; password: string }) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (d: object) => api.post('/projects', d),
  update: (id: string, d: object) => api.put(`/projects/${id}`, d),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const layoutsApi = {
  list: (projectId: string) => api.get(`/layouts/${projectId}`),
  create: (d: object) => api.post('/layouts', d),
  update: (id: string, d: object) => api.put(`/layouts/${id}`, d),
  delete: (id: string) => api.delete(`/layouts/${id}`),
};
