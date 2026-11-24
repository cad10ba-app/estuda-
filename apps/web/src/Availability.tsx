import { useEffect, useState } from 'react';
import { PERIODS, updateAvailability, windowsToSelection, type Period } from '@estuda/core';
import { deps } from './store';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Availability({ onChange }: { onChange: () => void }) {
  const [days, setDays] = useState<number[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    deps.store.listWindows().then((w) => {
      const sel = windowsToSelection(w);
      setDays(sel.weekdays);
      setPeriods(sel.periods);
    });
  }, []);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const save = async (d: number[], p: Period[]) => {
    try {
      setMsg('');
      await updateAvailability(deps, d, p);
      onChange();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <section className="card">
      <strong>Quando você estuda</strong>
      <div className="chips">
        {DAYS.map((d, i) => (
          <button key={d} className={`chip ${days.includes(i) ? 'on' : ''}`} onClick={() => { const n = toggle(days, i); setDays(n); void save(n, periods); }}>{d}</button>
        ))}
      </div>
      <div className="chips">
        {(Object.keys(PERIODS) as Period[]).map((p) => (
          <button key={p} className={`chip ${periods.includes(p) ? 'on' : ''}`} onClick={() => { const n = toggle(periods, p); setPeriods(n); void save(days, n); }}>{PERIODS[p].label}</button>
        ))}
      </div>
      {msg && <p className="warn">{msg}</p>}
    </section>
  );
}
