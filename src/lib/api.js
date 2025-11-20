const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function http(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  schema: () => http('/schema'),
  test: () => http('/test'),
  // Employees
  listEmployees: () => http('/employees'),
  createEmployee: (data) => http('/employees', { method: 'POST', body: JSON.stringify(data) }),
  // Time entries
  listTimeEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return http(`/time-entries${qs ? `?${qs}` : ''}`);
  },
  createTimeEntry: (data) => http('/time-entries', { method: 'POST', body: JSON.stringify(data) }),
  // Settings
  getSettings: () => http('/settings'),
  saveSettings: (data) => http('/settings', { method: 'POST', body: JSON.stringify(data) }),
  // Payrun
  generatePayrun: (data) => http('/payrun', { method: 'POST', body: JSON.stringify(data) }),
};
