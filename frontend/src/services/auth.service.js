import api from './api.js';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async getProfile() {
    const res = await api.get('/auth/me');
    return res.data;
  }
};
