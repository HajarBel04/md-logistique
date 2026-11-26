// Client API du module Flotte & Conformité (FastAPI /api/flotte)
// Toujours la même origine que le site (proxy Vite en local, réécriture Vercel en ligne) :
// indispensable pour que le cookie de session soit envoyé.
const HOST = '';
const ROOT = HOST + '/api/flotte';

/** Erreur API : message lisible + données éventuelles (ex. détail du blocage CT). */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const fileUrl = (path) => path || null;

async function request(path, { method = 'GET', json, form, root = ROOT } = {}) {
  const opts = { method, headers: {}, credentials: 'include' };
  if (json !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(json);
  } else if (form) {
    opts.body = form;
  }
  let res;
  try {
    res = await fetch(root + path, opts);
  } catch {
    throw new Error('Serveur inaccessible. Vérifiez votre connexion et réessayez.');
  }
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* réponse non JSON */ }
  if (!res.ok) {
    if (res.status === 401 && root === ROOT) window.dispatchEvent(new Event('md:session-expired'));
    const detail = data?.detail;
    const message = typeof detail === 'string' ? detail
      : typeof detail?.message === 'string' ? detail.message : `Erreur serveur (${res.status}).`;
    throw new ApiError(message, res.status, detail);
  }
  if (data === null && text) throw new Error('Réponse inattendue du serveur.');
  return data;
}

const upload = (path, file, extra = {}) => {
  const form = new FormData();
  form.append('file', file, file.name || 'document');
  Object.entries(extra).forEach(([k, v]) => form.append(k, String(v)));
  return request(path, { method: 'POST', form });
};

const AUTH = HOST + '/api/auth';
export const authApi = {
  status: () => request('/status', { root: AUTH }),
  me: () => request('/me', { root: AUTH }),
  login: (identifier, password) => request('/login', { root: AUTH, method: 'POST', json: { identifier, password } }),
  setup: (data) => request('/setup', { root: AUTH, method: 'POST', json: data }),
  logout: () => request('/logout', { root: AUTH, method: 'POST' }),
  changePassword: (current, next) => request('/password', { root: AUTH, method: 'POST', json: { current, new: next } }),
};

export const flotteApi = {
  meta: () => request('/meta'),
  dashboard: () => request('/dashboard'),

  vehicles: () => request('/vehicles'),
  vehicle: (id) => request(`/vehicles/${id}`),
  createVehicle: (data) => request('/vehicles', { method: 'POST', json: data }),
  updateVehicle: (id, data) => request(`/vehicles/${id}`, { method: 'PATCH', json: data }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  uploadInsurance: (id, file) => upload(`/vehicles/${id}/assurance`, file),
  deleteInsurance: (id) => request(`/vehicles/${id}/assurance`, { method: 'DELETE' }),

  drivers: () => request('/drivers'),
  driver: (id) => request(`/drivers/${id}`),
  createDriver: (data) => request('/drivers', { method: 'POST', json: data }),
  updateDriver: (id, data) => request(`/drivers/${id}`, { method: 'PATCH', json: data }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),
  uploadDriverDoc: (id, slot, file, cropped) =>
    upload(`/drivers/${id}/documents/${slot}`, file, { cropped: cropped ? 'true' : 'false' }),
  deleteDriverDoc: (id, slot) => request(`/drivers/${id}/documents/${slot}`, { method: 'DELETE' }),
  regenerateToken: (id) => request(`/drivers/${id}/token`, { method: 'POST' }),

  renew: (entityType, entityId, docType, date) =>
    request('/renew', { method: 'POST', json: { entityType, entityId, docType, date } }),

  alerts: (status = 'ACTIVE') => request(`/alerts?status=${status}`),
  snoozeAlert: (id, days) => request(`/alerts/${id}/snooze`, { method: 'POST', json: { days } }),
  reactivateAlert: (id) => request(`/alerts/${id}/reactivate`, { method: 'POST' }),
  settings: () => request('/settings'),
  saveSettings: (data) => request('/settings', { method: 'PUT', json: data }),
  testEmail: () => request('/settings/test-email', { method: 'POST' }),

  conversations: () => request('/conversations'),
  messages: (driverId) => request(`/drivers/${driverId}/messages`),
  sendMessage: (driverId, body, file) => {
    const form = new FormData();
    form.append('body', body || '');
    if (file) form.append('file', file, file.name || 'piece-jointe');
    return request(`/drivers/${driverId}/messages`, { method: 'POST', form });
  },

  // Comptes
  users: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', json: data }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', json: data }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Référentiels
  refs: () => request('/refs'),
  createRef: (kind, data) => request(`/refs/${kind}`, { method: 'POST', json: data }),
  updateRef: (kind, id, data) => request(`/refs/${kind}/${id}`, { method: 'PATCH', json: data }),
  deleteRef: (kind, id) => request(`/refs/${kind}/${id}`, { method: 'DELETE' }),

  // Formulaires chauffeurs, carburant, facturation
  dispatchOptions: () => request('/dispatch-options'),
  trips: (params = {}) => request(`/trips?${new URLSearchParams(Object.entries(params).filter(([, v]) => v))}`),
  createTrip: (data) => request('/trips', { method: 'POST', json: data }),
  updateTrip: (id, data) => request(`/trips/${id}`, { method: 'PATCH', json: data }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),
  uploadTripCmr: (id, file) => upload(`/trips/${id}/cmr`, file),
  uploadMyCmr: (id, file) => upload(`/me/trips/${id}/cmr`, file),
  fuelRates: () => request('/fuel-rates'),
  setFuelRate: (month, rate) => request(`/fuel-rates/${month}`, { method: 'PUT', json: { rate } }),
  companyInfo: () => request('/company-info'),
  saveCompanyInfo: (data) => request('/company-info', { method: 'PUT', json: data }),
  invoices: () => request('/invoices'),
  invoice: (id) => request(`/invoices/${id}`),
  createInvoice: (data) => request('/invoices', { method: 'POST', json: data }),
  updateInvoice: (id, data) => request(`/invoices/${id}`, { method: 'PATCH', json: data }),
  deleteInvoice: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Documents envoyés par les chauffeurs
  verifyDoc: (driverId, slot, verified = true) =>
    request(`/drivers/${driverId}/documents/${slot}/verify`, { method: 'POST', json: { verified } }),
  docsToVerify: () => request('/documents/a-verifier'),

  // Espace chauffeur
  me: () => request('/me'),
  myOptions: () => request('/me/options'),
  myTrips: () => request('/me/trips'),
  createMyTrip: (data) => request('/me/trips', { method: 'POST', json: data }),
  uploadMyDoc: (slot, file, cropped) => upload(`/me/documents/${slot}`, file, { cropped: cropped ? 'true' : 'false' }),
  myMessages: () => request('/me/messages'),
  sendMyMessage: (body, file) => {
    const form = new FormData();
    form.append('body', body || '');
    if (file) form.append('file', file, file.name || 'photo');
    return request('/me/messages', { method: 'POST', form });
  },

  portal: (token) => request(`/portail/${encodeURIComponent(token)}`),
  portalSend: (token, body, file) => {
    const form = new FormData();
    form.append('body', body || '');
    if (file) form.append('file', file, file.name || 'photo');
    return request(`/portail/${encodeURIComponent(token)}/messages`, { method: 'POST', form });
  },
};
