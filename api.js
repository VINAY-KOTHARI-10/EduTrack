// API Helper
function resolveApiBase() {
  const runtimeBase = window.__API_BASE_URL__
    || document.querySelector('meta[name="api-base-url"]')?.getAttribute('content')
    || localStorage.getItem('API_BASE_URL');

  if (runtimeBase) {
    return runtimeBase.replace(/\/$/, '');
  }

  // Live Server / static dev frontend can call local backend.
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }

  // Same-origin in production (for example if served from backend).
  return '';
}

const API_BASE = resolveApiBase();

function toApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

const API = {
  async get(path) {
    const r = await authFetch(toApiUrl(path));
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body) {
    const r = await authFetch(toApiUrl(path), {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(path) {
    const r = await authFetch(toApiUrl(path), { method: 'DELETE' });
    return r.json();
  }
};

// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }
});

// Toast
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Stars to string
function starsStr(n) {
  return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
}

// Format date
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
