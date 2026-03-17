// Premium Elliott Wave component
import { Waves, Target } from 'lucide-react';
import { fmt } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function ElliottWave({ elliottWave, spot }) {
  if (!elliottWave) return null;
  const { wave, bias, prob, nextTargets, rsi, ma20, w52hi, w52lo } = elliottWave;

  const biasColor = bias === 'Bullish' ? 'text-neon-green' : bias === 'Bearish' ? 'text-neon-red' : 'text-yellow-400';
  const waveLabel = `Wave ${wave}`;
  const waveTooltipKey = `Elliott Wave ${wave}`;

  const targetTooltipKey = (label) => {
    const m = label.match(/[Ww]ave\s+(\d+|[A-Ca-c](?:\/[A-Ca-c])?)/i);
    return m ? `Elliott Wave ${m[1].toUpperCase()}` : waveTooltipKey;
  };

  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <Waves size={13} className="text-purple-400" /> Elliott Wave
        <InfoTooltip metric={waveTooltipKey} />
      </h2>

      <div className="flex items-center flex-wrap gap-3 sm:gap-5 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400 font-mono flex items-center gap-1 justify-center">
            {waveLabel}
            <InfoTooltip metric={waveTooltipKey} />
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">Current</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${biasColor}`}>{bias}</div>
          <div className="text-[9px] text-gray-600">Bias</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-neon-cyan font-mono">{prob}%</div>
          <div className="text-[9px] text-gray-600">Conf.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {[
          ['Weekly RSI', rsi, rsi > 70 ? 'text-orange-400' : rsi < 30 ? 'text-blue-400' : 'text-gray-200'],
          ['MA20 Weekly', fmt.inr(ma20), spot > ma20 ? 'text-neon-green' : 'text-neon-red'],
          ['52W High', fmt.inr(w52hi), 'text-gray-200'],
          ['52W Low', fmt.inr(w52lo), 'text-gray-200'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-black/20 rounded-lg p-2.5">
            <div className="text-gray-600 text-[10px] mb-0.5">{label}</div>
            <div className={`font-semibold font-mono ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] text-gray-600 mb-2 flex items-center gap-1">
          <Target size={10} /> Next Scenarios
        </div>
        <div className="space-y-1.5">
          {(nextTargets || []).map((t, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2">
              <span className="text-gray-400 flex items-center gap-1">
                {t.label}
                <InfoTooltip metric={targetTooltipKey(t.label)} />
              </span>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-semibold text-white">{fmt.inr(t.level)}</span>
                <span className={`text-[11px] ${t.prob >= 60 ? 'text-neon-green' : 'text-yellow-400'}`}>{t.prob}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-gray-700 mt-3">
        Rule-based model: RSI, MA, 52W range. Probabilistic counts.
      </p>
    </div>
  );
}
