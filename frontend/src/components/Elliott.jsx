// Premium Elliott Wave component
import { Waves, Target } from 'lucide-react';
import { fmt } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function ElliottWave({ elliottWave, neoWave, spot }) {
  if (!elliottWave) return null;
  const { wave, bias, prob, nextTargets, rsi, ma20, w52hi, w52lo } = elliottWave;

  const biasColor = bias === 'Bullish' ? 'text-emerald-700 dark:text-neon-green' : bias === 'Bearish' ? 'text-rose-600 dark:text-neon-red' : 'text-sky-700 dark:text-amber-400';
  const waveLabel = `Wave ${wave}`;
  const waveTooltipKey = `Elliott Wave ${wave}`;

  const targetTooltipKey = (label) => {
    const m = label.match(/[Ww]ave\s+(\d+|[A-Ca-c](?:\/[A-Ca-c])?)/i);
    return m ? `Elliott Wave ${m[1].toUpperCase()}` : waveTooltipKey;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Waves size={14} className="text-purple-400 shrink-0" />
        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Elliott Wave</h2>
        <InfoTooltip metric={waveTooltipKey} />
      </div>

      <div className="flex items-center flex-wrap gap-3 sm:gap-5 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400 font-mono flex items-center gap-1 justify-center">
            {waveLabel}
            <InfoTooltip metric={waveTooltipKey} />
          </div>
          <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mt-0.5">Current</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
            <span className={biasColor}>{bias === 'Bullish' ? '▲' : bias === 'Bearish' ? '▼' : '●'}</span> {bias}
          </div>
          <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">Bias</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-sky-800 dark:text-neon-cyan font-mono">{prob}%</div>
          <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">Conf.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {[
          ['Weekly RSI', rsi, rsi > 70 ? 'text-orange-400' : rsi < 30 ? 'text-blue-400' : 'text-gray-800 dark:text-wcag-text'],
          ['MA20 Weekly', fmt.inr(ma20), spot > ma20 ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'],
          ['52W High', fmt.inr(w52hi), 'text-gray-800 dark:text-wcag-text'],
          ['52W Low', fmt.inr(w52lo), 'text-gray-800 dark:text-wcag-text'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-black/20 rounded-lg p-2.5">
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5">{label}</div>
            <div className="font-semibold font-mono text-gray-900 dark:text-wcag-text flex items-center gap-1">
              {cls.includes('text-emerald-700') || cls.includes('text-green') ? <span className={cls}>▲</span> : cls.includes('text-red') ? <span className={cls}>▼</span> : cls.includes('text-orange') || cls.includes('text-blue') ? <span className={cls}>●</span> : null}
              {val}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mb-2 flex items-center gap-1">
          <Target size={10} /> Next Scenarios
        </div>
        <div className="space-y-1.5">
          {(nextTargets || []).map((t, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2">
              <span className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted flex items-center gap-1">
                {t.label}
                <InfoTooltip metric={targetTooltipKey(t.label)} />
              </span>
              <div className="flex items-center gap-3 font-mono">
                <span className="font-semibold text-gray-900 dark:text-wcag-text">{fmt.inr(t.level)}</span>
                <span className="text-[11px] text-gray-900 dark:text-wcag-text flex items-center justify-end gap-1">
                  <span className={t.prob >= 60 ? 'text-emerald-700 dark:text-neon-green' : 'text-sky-700 dark:text-amber-400'}>{t.prob >= 60 ? '▲' : '●'}</span>
                  {t.prob}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Neo Wave Intelligence */}
      <div className="mt-5 border-t border-white/[0.04] pt-4">
        <div className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mb-4 flex items-center justify-between font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1"><Waves size={10} className="text-blue-400" /> Neo Wave Intelligence <InfoTooltip metric="Neo Wave Extensions" /></span>
        </div>
        
        {neoWave ? (
          <>
            <div className="flex items-center flex-wrap gap-3 sm:gap-5 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-wcag-text font-mono flex items-center gap-1 justify-center">
                  {neoWave.level}
                  <InfoTooltip metric={`Neo Wave ${neoWave.level}`} contextText={`Algorithm explicitly identifies current structural hierarchy as ${neoWave.level}.`} />
                </div>
                <div className="text-[9px] text-gray-700 dark:text-wcag-muted mt-0.5">Structure</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
                  {neoWave.currentWave}
                  <InfoTooltip metric={`Neo Wave ${neoWave.currentWave}`} contextText={`Active traversal mapped exactly to Phase ${neoWave.currentWave}.`} />
                </div>
                <div className="text-[9px] text-gray-700 dark:text-wcag-muted mt-0.5">Current Phase</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
                  <span className={neoWave.bias === 'Bullish' ? 'text-emerald-700 dark:text-neon-green' : neoWave.bias === 'Bearish' ? 'text-rose-600 dark:text-neon-red' : 'text-sky-700 dark:text-amber-400'}>
                    {neoWave.bias === 'Bullish' ? '▲' : neoWave.bias === 'Bearish' ? '▼' : '●'}
                  </span> {neoWave.bias}
                </div>
                <div className="text-[9px] text-gray-700 dark:text-wcag-muted mt-0.5 flex items-center justify-center gap-1">Bias <InfoTooltip metric={`Neo Wave Bias`} contextText={`Calculated internal momentum explicitly slants ${neoWave.bias} based on active phase distributions.`} /></div>
              </div>
            </div>

            <div className="space-y-1.5">
              {(neoWave.nextTargets || []).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2">
                  <span className="text-gray-700 dark:text-wcag-muted flex items-center gap-1">
                    {t.label}
                    <InfoTooltip metric={`Neo Wave ${t.label}`} contextText={t.label.includes('Stop') ? `Hard algorithmic invalidation triggered securely at ${fmt.inr(t.level)} to prevent structural overlap failure.` : `Upside theoretical structural target mapping to exactly ${fmt.inr(t.level)} at ${t.prob}% confidence limit.`} />
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-semibold text-gray-900 dark:text-wcag-text">{fmt.inr(t.level)}</span>
                    <span className="text-[11px] text-gray-900 dark:text-wcag-text flex items-center justify-end gap-1">
                      <span className={t.prob >= 60 ? 'text-emerald-700 dark:text-neon-green' : 'text-sky-700 dark:text-amber-400'}>{t.prob >= 60 ? '▲' : '●'}</span>
                      {t.prob}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-2">
            <div className="flex items-start gap-2 bg-black/20 rounded-lg px-3 py-2">
              <span className="text-emerald-700 dark:text-neon-green font-bold text-[10px] mt-0.5">●</span>
              <div>
                <div className="text-[11px] font-bold text-gray-900 dark:text-wcag-text">Monowave</div>
                <div className="text-[9px] text-gray-700 dark:text-wcag-muted leading-tight">The fundamental building block. A single uncorrected directional price movement.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mt-3">
        Rule-based model: RSI, MA, 52W range. Probabilistic counts.
      </p>
    </div>
  );
}
