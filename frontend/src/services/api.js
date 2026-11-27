import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL ?? '/api',
});

// Ces routes appartiennent à l'ancien serveur Node, pas encore en ligne :
// une réponse 404/502/503 (ou l'absence de réponse) signifie « module pas encore disponible ».
api.interceptors.response.use(undefined, (err) => {
  const status = err.response?.status;
  err.moduleUnavailable = !err.response || [404, 502, 503].includes(status);
  return Promise.reject(err);
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