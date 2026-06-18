import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

export function uploadWebfleet(formData) {
  return api.post('/upload-webfleet', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function getAlexDashboard() {
  return api.get('/alex/dashboard');
}

export function getAlexDrivers() {
  return api.get('/alex/drivers');
}

export function getAlexDocuments() {
  return api.get('/alex/documents');
}

export function getAlexPlanning() {
  return api.get('/alex/planning');
}

export function getAlexImports() {
  return api.get('/alex/imports');
}

export default api;