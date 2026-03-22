import api from './api';

const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  register: (data) =>
    api.post('/auth/register', data),

  getMe: () =>
    api.get('/auth/me'),
};

export default authService;