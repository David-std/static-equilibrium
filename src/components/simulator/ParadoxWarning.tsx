import type { HangingWeight, PhysicsParams } from '../../types';
import { formatDec } from '../../utils/format';

interface ParadoxWarningProps {
  show: boolean;
  params: PhysicsParams;
  weights: HangingWeight[];
  isFBalanced: boolean;
  unitSystem: 'cgs' | 'si';
}

export function ParadoxWarning({
  show,
  params,
  weights,
  isFBalanced,
  unitSystem,
}: ParadoxWarningProps) {
  return (
    <>
      {show && (() => {
        const totalLoadsMass = weights.reduce((s, w) => s + w.mass, 0);
        const totalDownMass = params.rulerMass + totalLoadsMass;
        const totalUpMass = params.m1 + params.m2;
        const netFG = totalUpMass - totalDownMass;
        const netFN = Math.abs((netFG / 1000) * params.gravity);
        const torqueCenterNm = weights.reduce((s, w) => s + ((w.mass / 1000) * params.gravity) * ((params.rulerLength / 2 - w.x) / 100), 0);
        const isTorqueCenterOk = Math.abs(torqueCenterNm) < 0.0015;
        return (
          <div className="bg-[#FAF9F5] border border-[#eadecb] rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in text-stone-800">
            <div className="flex items-center justify-between border-b border-[#eadecb] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800">Análisis del Experimento: Balance de Fuerzas Externas</h3>
              </div>
              <span className="text-[9px] bg-amber-100 text-[#7c2d12] font-black px-2 py-0.5 rounded uppercase font-mono">Caso Especial</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Has configurado un sistema simétrico de tensión de <b>{params.m1} g</b> en cada extremo.{' '}
              {totalLoadsMass > 0 ? <span>Con <b>{weights.length} {weights.length === 1 ? 'carga colgada' : 'cargas colgadas'}</b> (total: <b>{totalLoadsMass} g</b>).</span> : <span>Sin cargas adicionales suspendidas.</span>}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#eadecb]/60 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">1. Primera Condición: ∑F<sub>y</sub> = 0 (Traslación)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-sans ${isFBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{isFBalanced ? 'EQUILIBRIO' : 'DESCOMPENSADO'}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {isFBalanced ? <span>∑F<sub>y</sub> = 0. Las dos poleas ({totalUpMass} g) equilibran el peso total ({totalDownMass} g).</span> : <span>∑F<sub>y</sub> ≠ 0. Poleas: <b>{totalUpMass} g</b> vs peso: <b>{totalDownMass} g</b>.</span>}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-[#eadecb]/60 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">2. Segunda Condición: ∑τ = 0 (Rotación)</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-sans ${isTorqueCenterOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{isTorqueCenterOk ? 'EQUILIBRIO' : 'DESCOMPENSADO'}</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    {isTorqueCenterOk ? <span>∑τ = 0 alrededor del centro. La regla permanece horizontal.</span> : <span>∑τ = {formatDec(torqueCenterNm, 4)} N·m ≠ 0. La regla gira.</span>}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#FAF9F5] border border-[#eadecb] rounded-xl p-4 text-[11.5px] text-stone-800 flex flex-col gap-2.5 shadow-sm">
              <p className="font-bold text-amber-950 font-sans">
                {netFG > 0 ? `⚠️ Fuerza neta ascendente de ${Math.abs(netFG)} g (${formatDec(netFN, 2)} N). La regla subiría.` : `⚠️ Fuerza neta descendente de ${Math.abs(netFG)} g (${formatDec(netFN, 2)} N). La regla caería.`}
              </p>
              <div className="bg-white/95 rounded-lg p-2.5 flex flex-col sm:flex-row gap-2 justify-between items-center border border-[#eadecb] font-mono text-[10px] text-stone-600">
                <span>Masa requerida en poleas (m₁ + m₂):</span>
                <span className="font-black text-amber-900 bg-amber-50/65 px-2 py-0.5 rounded border border-amber-200">
                  {unitSystem === 'si' ? `${formatDec(totalDownMass / 1000, 3)} kg` : `${totalDownMass} g`}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
