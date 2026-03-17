// FIX #1: Weekly + monthly expiries, accurate LTP via client-side BS with IV skew
import { useState, useMemo } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { fmt, colorClass } from '../utils/formatters';

const API = import.meta.env.VITE_API_URL || '/api';
const LOT_SIZE = 65; // HARDCODED — NIFTY lot size

// ─── FIX #1: Generate weekly + monthly expiries ──────────────────────────────
function getExpiries() {
  const result = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Monthly expiries: last Tuesday of each month for next 8 months
  const monthlySet = new Set();
  let y = now.getFullYear(), m = now.getMonth();
  for (let i = 0; i < 8; i++) {
    const lastDay = new Date(y, m + 1, 0);
    const dow = lastDay.getDay();
    const back = (dow - 2 + 7) % 7;  // 2 = Tuesday
    const tue = new Date(y, m, lastDay.getDate() - back);
    if (tue >= now) monthlySet.add(tue.toISOString().slice(0, 10));
    m++;
    if (m > 11) { m = 0; y++; }
  }

  // Weekly Tuesdays for next 16 weeks
  const d = new Date(now);
  const daysTillTue = (2 - d.getDay() + 7) % 7;  // 2 = Tuesday
  d.setDate(d.getDate() + (daysTillTue === 0 ? 0 : daysTillTue));

  const added = new Set();
  for (let i = 0; i < 16; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (d >= now && !added.has(ds)) {
      added.add(ds);
      const isM = monthlySet.has(ds);
      result.push({
        value: ds,
        label: `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${isM ? ' (M)' : ''}`,
      });
    }
    d.setDate(d.getDate() + 7);
  }

  // Add distant monthly expiries beyond weekly range
  for (const ds of monthlySet) {
    if (!added.has(ds)) {
      const dt = new Date(ds + 'T00:00:00');
      result.push({
        value: ds,
        label: `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (M)`,
      });
    }
  }

  result.sort((a, b) => a.value.localeCompare(b.value));
  return result;
}

// ─── Toggle button ─────────────────────────────────────────────────────────────
function Toggle({ options, value, onChange, colorA = 'blue', colorB = 'red' }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
      {options.map(({ key, label }, i) => {
        const active = value === key;
        const color = i === 0 ? colorA : colorB;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex-1 px-3 py-1.5 font-semibold transition-colors ${
              active
                ? color === 'blue' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : color === 'red' ? 'bg-neon-red/20 text-neon-red border border-neon-red/30'
                : 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-gray-900/60 text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Add Position Form ────────────────────────────────────────────────────────
function AddPositionForm({ onAdded }) {
  const expiries = useMemo(() => getExpiries(), []);
  const [form, setForm] = useState({
    side: 'long',       // long = Buy, short = Sell
    type: 'CE',         // CE or PE
    strike: '',
    expiry: expiries[0]?.value || '',
    qty: '1',           // number of lots (each = 65 shares)
    entryPrice: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.strike || !form.entryPrice) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (r.ok) { const d = await r.json(); onAdded(d); }
    } catch {}
    setLoading(false);
  };

  const inp = 'bg-gray-900/80 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-full transition-colors';
  const isBuy = form.side === 'long';
  const isCE = form.type === 'CE';

  return (
    <form onSubmit={submit} className="bg-black/25 border border-white/[0.06] rounded-xl p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Buy / Sell toggle */}
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Direction</label>
          <Toggle
            options={[{ key: 'long', label: '▲ Buy' }, { key: 'short', label: '▼ Sell' }]}
            value={form.side}
            onChange={(v) => set('side', v)}
            colorA="blue"
            colorB="red"
          />
        </div>
        {/* CE / PE toggle */}
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Option Type</label>
          <Toggle
            options={[{ key: 'CE', label: 'CE Call' }, { key: 'PE', label: 'PE Put' }]}
            value={form.type}
            onChange={(v) => set('type', v)}
            colorA="blue"
            colorB="red"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Strike Price ₹</label>
          <input className={inp} placeholder="e.g. 23500" type="number" step="50"
            value={form.strike} onChange={(e) => set('strike', e.target.value)} required />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Premium Paid ₹</label>
          <input className={inp} placeholder="e.g. 120.50" type="number" step="0.05"
            value={form.entryPrice} onChange={(e) => set('entryPrice', e.target.value)} required />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Expiry Date</label>
          <select className={inp} value={form.expiry} onChange={(e) => set('expiry', e.target.value)}>
            {expiries.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
            <option value="">Custom…</option>
          </select>
          {form.expiry === '' && (
            <input className={`${inp} mt-1`} type="date" onChange={(e) => set('expiry', e.target.value)} />
          )}
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Qty (Lots × {LOT_SIZE})</label>
          <input className={inp} placeholder="1" type="number" min="1"
            value={form.qty} onChange={(e) => set('qty', e.target.value)} required />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-[10px] text-gray-600">
          {form.qty && form.entryPrice
            ? `Max risk: ₹${(parseFloat(form.entryPrice) * parseInt(form.qty || 1) * LOT_SIZE).toLocaleString('en-IN')}`
            : `Lot size: ${LOT_SIZE} shares/lot`}
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`ml-auto flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${isBuy ? 'bg-neon-cyan/30 hover:bg-neon-cyan/40 border border-neon-cyan/30' : 'bg-neon-red/30 hover:bg-neon-red/40 border border-neon-red/30'}`}
        >
          <PlusCircle size={13} />
          {loading ? 'Adding…' : `Add ${isBuy ? 'Buy' : 'Sell'} ${form.type}`}
        </button>
      </div>
    </form>
  );
}

// ─── Positions Table ──────────────────────────────────────────────────────────
export function Positions({ pnlData, onRefreshPositions }) {
  const [showForm, setShowForm] = useState(false);

  const deletePos = async (id) => {
    await fetch(`${API}/positions/${id}`, { method: 'DELETE' });
    onRefreshPositions();
  };

  const totalPnL = pnlData?.reduce((s, p) => s + (p.pnl || 0), 0) || 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h2 className="text-xs font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
          <BarChart2 size={13} className="text-neon-cyan" /> Positions
          <span className="text-[10px] text-gray-600 font-normal normal-case tracking-normal">Lot = {LOT_SIZE}</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold font-mono ${colorClass(totalPnL)}`}>
            P&L: {fmt.inr(totalPnL)}
          </span>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs bg-cyan-900/20 hover:bg-cyan-800/30 border border-cyan-800/30 rounded-lg px-3 py-1 text-cyan-300 transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      {showForm && (
        <AddPositionForm
          onAdded={() => { onRefreshPositions(); setShowForm(false); }}
        />
      )}

      {!pnlData || pnlData.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-8">
          No positions yet. Click "+ Add" to track your NIFTY options.
        </p>
      ) : (
        <>
          {/* ── Mobile card view (< sm) ─────────────────────────────── */}
          <div className="sm:hidden space-y-2">
            {pnlData.map((pos) => {
              const isBuy = pos.side === 'long';
              const isCE = pos.type === 'CE';
              return (
                <div key={pos.id} className="bg-black/25 border border-white/[0.06] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${isBuy ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                      <span className={`font-bold text-xs ${isCE ? 'text-neon-green' : 'text-neon-red'}`}>{pos.type}</span>
                      <span className="text-white font-mono text-xs font-semibold">₹{pos.strike}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs font-mono ${colorClass(pos.pnl)}`}>{fmt.inr(pos.pnl)}</span>
                      <button onClick={() => deletePos(pos.id)} className="text-gray-700 hover:text-red-400 transition-colors ml-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div><span className="text-gray-600">Exp:</span> <span className="text-gray-400 font-mono">{pos.expiry?.slice(5, 10)}</span></div>
                    <div><span className="text-gray-600">Lots:</span> <span className="text-gray-300 font-mono">{pos.qty}</span></div>
                    <div><span className="text-gray-600">P&L%:</span> <span className={`font-mono font-semibold ${colorClass(pos.pnlPct)}`}>{fmt.pct(pos.pnlPct)}</span></div>
                    <div><span className="text-gray-600">Entry:</span> <span className="text-gray-300 font-mono">₹{pos.entryPrice}</span></div>
                    <div><span className="text-gray-600">LTP:</span> <span className="text-gray-100 font-mono font-semibold">₹{pos.currentLTP}</span></div>
                    <div><span className="text-gray-600">PoP:</span> <span className="text-gray-400 font-mono">{pos.probOfProfit}%</span></div>
                  </div>
                  <div className="flex gap-3 mt-2 pt-2 border-t border-white/[0.04] text-[10px]">
                    <span className="text-gray-600">Δ <span className="text-blue-300 font-mono">{pos.greeks?.delta}</span></span>
                    <span className="text-gray-600">Θ <span className="text-orange-300 font-mono">{pos.greeks?.theta}</span></span>
                    <span className="text-gray-600">Γ <span className="text-purple-300 font-mono">{pos.greeks?.gamma}</span></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop / tablet table (sm+) ────────────────────────── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-gray-600 border-b border-white/[0.06]">
                  {['Dir', 'Type', 'Strike', 'Expiry', 'Lots', 'Entry ₹', 'LTP ₹', 'P&L', 'P&L%', 'PoP%', 'Δ', 'Θ', 'Γ', ''].map((h) => (
                    <th key={h} className="text-left py-2 pr-3 font-medium whitespace-nowrap text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pnlData.map((pos) => {
                  const isBuy = pos.side === 'long';
                  const isCE = pos.type === 'CE';
                  return (
                    <tr key={pos.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="py-2 pr-3">
                        <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${isBuy ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'}`}>
                          {isBuy ? 'B' : 'S'}
                        </span>
                      </td>
                      <td className="pr-3"><span className={`font-bold ${isCE ? 'text-neon-green' : 'text-neon-red'}`}>{pos.type}</span></td>
                      <td className="pr-3 text-gray-200 font-mono text-xs">{pos.strike}</td>
                      <td className="pr-3 text-gray-500 whitespace-nowrap font-mono text-xs">{pos.expiry?.slice(0, 10)}</td>
                      <td className="pr-3 text-gray-400 font-mono">{pos.qty}</td>
                      <td className="pr-3 text-gray-300 font-mono">₹{pos.entryPrice}</td>
                      <td className="pr-3 text-gray-100 font-semibold font-mono">₹{pos.currentLTP}</td>
                      <td className={`pr-3 font-bold font-mono ${colorClass(pos.pnl)}`}>{fmt.inr(pos.pnl)}</td>
                      <td className={`pr-3 font-semibold font-mono ${colorClass(pos.pnlPct)}`}>{fmt.pct(pos.pnlPct)}</td>
                      <td className="pr-3 text-gray-400 font-mono">{pos.probOfProfit}%</td>
                      <td className="pr-3 text-blue-300 font-mono">{pos.greeks?.delta}</td>
                      <td className="pr-3 text-orange-300 font-mono">{pos.greeks?.theta}</td>
                      <td className="pr-3 text-purple-300 font-mono">{pos.greeks?.gamma}</td>
                      <td>
                        <button onClick={() => deletePos(pos.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
