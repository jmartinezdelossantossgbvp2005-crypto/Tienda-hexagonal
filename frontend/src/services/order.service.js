import api from './api.js';

export const orderService = {
  async create(data) {
    const res = await api.post('/orders', data);
    return res.data;
  },

  async getAll() {
    const res = await api.get('/orders');
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  async updateStatus(id, status) {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  }
};

