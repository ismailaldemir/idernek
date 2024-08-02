import axios from 'axios';

// Ortam değişkenleri api url
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// axios örneği oluşturma
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// her bir metod için nesne tanımlama 
export const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  // ihtiyaç duyulan metodlar eklenecek
};
