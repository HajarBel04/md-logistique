import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL ?? '/api',
});

// Ces routes appartiennent à l'ancien serveur Node, pas encore en ligne. Selon l'environnement, on reçoit
// une erreur (404/5xx, serveur absent) ou la page HTML par défaut du serveur Python (200) :
// dans les deux cas, le module est signalé « pas encore disponible » au lieu d'afficher une erreur.
const unavailable = (err) => Object.assign(err, { moduleUnavailable: true });
api.interceptors.response.use(
  (res) => {
    const type = String(res.headers?.['content-type'] || '');
    if (type.includes('text/html') || typeof res.data === 'string') {
      return Promise.reject(unavailable(new Error('Module indisponible')));
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    if (!err.response || [404, 500, 502, 503, 504].includes(status)) unavailable(err);
    return Promise.reject(err);
  },
);

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