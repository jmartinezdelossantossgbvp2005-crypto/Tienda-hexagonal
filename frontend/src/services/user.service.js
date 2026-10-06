import api from './api.js';

export const userService = {
  async getAll() {
    const res = await api.get('/users');
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};
