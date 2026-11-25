export type Theme = 'auto' | 'light' | 'dark';
const KEY = 'estuda.theme';

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch { return 'auto'; }
}

/** Tema efetivo (resolve "auto" pelo sistema). */
export function effectiveTheme(t: Theme = getTheme()): 'light' | 'dark' {
  if (t !== 'auto') return t;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(t: Theme = getTheme()) {
  const root = document.documentElement;
  if (t === 'auto') delete root.dataset.theme; else root.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', effectiveTheme(t) === 'dark' ? '#0d1020' : '#4f46e5');
}

export function setTheme(t: Theme) {
  try { t === 'auto' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, t); } catch { /* sem storage */ }
  applyTheme(t);
}
