// Frontend utility formatters
// UPDATED FOR REFINEMENT #3 — add inCr for FII/DII values already in crores
export const fmt = {
  inr: (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
  pct: (v) => v == null ? '—' : `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`,
  num: (v, d = 2) => v == null ? '—' : Number(v).toFixed(d),
  // cr: converts raw rupees to crores (divides by 1e7) — use for volume/OI rupee values
  cr: (v) => v == null ? '—' : `₹${(Number(v) / 1e7).toFixed(2)} Cr`,
  // inCr: value is ALREADY in crores (NSE FII/DII API returns crore values directly)
  inCr: (v) => v == null ? '—' : `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`,
  large: (v) => {
    if (v == null) return '—';
    const n = Number(v);
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  },
};

export function colorClass(v) {
  if (v == null) return 'text-gray-400';
  return Number(v) >= 0 ? 'text-neon-green' : 'text-neon-red';
}

export function biasColor(bias) {
  if (!bias) return 'text-gray-400';
  const b = bias.toLowerCase();
  if (b.includes('bull')) return 'text-neon-green';
  if (b.includes('bear')) return 'text-neon-red';
  if (b.includes('caution') || b.includes('mixed')) return 'text-amber-400';
  return 'text-gray-400';
  return 'text-yellow-400';
}

export function sentimentBg(label) {
  if (!label) return 'bg-gray-800';
  const l = label.toLowerCase();
  if (l.includes('bull')) return 'bg-emerald-900/40';
  if (l.includes('bear')) return 'bg-red-900/40';
  return 'bg-yellow-900/30';
}
