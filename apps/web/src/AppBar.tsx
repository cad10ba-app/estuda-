import { useState } from 'react';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { effectiveTheme, setTheme } from './theme';

export function AppBar() {
  const [mode, setMode] = useState(effectiveTheme());
  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setMode(next);
  };
  return (
    <header className="appbar">
      <div className="brand">
        <Logo size={34} />
        <span className="wordmark">Estuda</span>
      </div>
      <button className="icon-btn" onClick={toggle} aria-label={mode === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'} title="Alternar tema">
        <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
    </header>
  );
}
