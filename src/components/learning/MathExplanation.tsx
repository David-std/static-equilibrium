/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { HangingWeight, PhysicsParams } from '../../types';
import { CheckCircle2, AlertTriangle, Anchor } from 'lucide-react';
import { formatDec } from '../../utils/format';

interface MathExplanationProps {
  params: PhysicsParams;
  weights: HangingWeight[];
  onChangePivot: (p: number) => void;
  unitSystem: 'cgs' | 'si';
  equilibriumStatus: {
    isFBalanced: boolean;
    isTorqueBalanced: boolean;
    fNetY: number;
    torqueNet: number;
    t1Val: number;
    t2Val: number;
    rulerWVal: number;
    totalDownWVal: number;
  };
}

export const MathExplanation: React.FC<MathExplanationProps> = ({
  params,
  weights,
  onChangePivot,
  unitSystem,
  equilibriumStatus,
}) => {
  const { m1, m2, rulerMass, rulerLength, gravity, pivot } = params;
  const g = gravity;

  const getTorqueItem = (name: string, forceN: number, equivalentMassG: number, posCm: number, isPullUp: boolean) => {
    const distanceCm = Math.abs(posCm - pivot);
    const distanceM = distanceCm / 100;
    
    let direction: 'antihorario' | 'horario' | 'nulo' = 'nulo';
    let signSymbol = '';

    if (distanceCm > 0.01) {
      if (isPullUp) {
        if (posCm < pivot) {
          direction = 'horario';
          signSymbol = '(-)';
        } else {
          direction = 'antihorario';
          signSymbol = '(+)';
        }
      } else {
        if (posCm < pivot) {
          direction = 'antihorario';
          signSymbol = '(+)';
        } else {
          direction = 'horario';
          signSymbol = '(-)';
        }
      }
    }

    const torqueNcmActual = forceN * distanceCm; // N * cm
    const torqueNmActual = forceN * distanceM; // N * m
    const torqueGcmActual = equivalentMassG * distanceCm; // g * cm (mass equivalence)

    return {
      name,
      forceN,
      massG: equivalentMassG,
      posCm,
      distanceCm,
      distanceM,
      direction,
      signSymbol,
      torqueNcm: torqueNcmActual,
      torqueNm: torqueNmActual,
      torqueGcm: torqueGcmActual,
    };
  };

  const torqueItems: any[] = [];

  torqueItems.push(getTorqueItem(<span>Tensión <i>T</i><sub>1</sub></span>, equilibriumStatus.t1Val, m1, 0, true));

  torqueItems.push(getTorqueItem(<span>Tensión <i>T</i><sub>2</sub></span>, equilibriumStatus.t2Val, m2, rulerLength, true));

  torqueItems.push(getTorqueItem(<span>Peso de la regla (<i>W</i><sub>regla</sub>)</span>, equilibriumStatus.rulerWVal, rulerMass, rulerLength / 2, false));

  weights.forEach((w) => {
    const fVal = (w.mass / 1000) * g;
    torqueItems.push(getTorqueItem(<span>Peso de la carga <i>W</i><sub>{w.name}</sub></span>, fVal, w.mass, w.x, false));
  });

  const ccwItems = torqueItems.filter((i) => i.direction === 'antihorario');
  const cwItems = torqueItems.filter((i) => i.direction === 'horario');

  const ccwSumGcm = ccwItems.reduce((sum, i) => sum + i.torqueGcm, 0);
  const cwSumGcm = cwItems.reduce((sum, i) => sum + i.torqueGcm, 0);

  const ccwSumNm = ccwItems.reduce((sum, i) => sum + i.torqueNm, 0);
  const cwSumNm = cwItems.reduce((sum, i) => sum + i.torqueNm, 0);

  const netTorqueGcm = ccwSumGcm - cwSumGcm;
  const netTorqueNm = ccwSumNm - cwSumNm;

  const upForces = [
    { name: <span>Tensión izquierda <i>T</i><sub>1</sub></span>, val: equilibriumStatus.t1Val, mass: m1 },
    { name: <span>Tensión derecha <i>T</i><sub>2</sub></span>, val: equilibriumStatus.t2Val, mass: m2 },
  ];

  const downForces = [
    { name: <span>Peso de la regla (<i>W</i><sub>regla</sub>)</span>, val: equilibriumStatus.rulerWVal, mass: rulerMass },
    ...weights.map(w => ({ name: <span>Peso de la carga <i>W</i><sub>{w.name}</sub> a {formatDec(w.x, 1)} cm</span>, val: (w.mass / 1000) * g, mass: w.mass }))
  ];

  const totalUpForceN = upForces.reduce((sum, f) => sum + f.val, 0);
  const totalDownForceN = downForces.reduce((sum, f) => sum + f.val, 0);
  const totalUpMassG = m1 + m2;
  const totalDownMassG = rulerMass + weights.reduce((sum, w) => sum + w.mass, 0);

  const isFBalanced = Math.abs(totalUpForceN - totalDownForceN) < 0.015;
  const isTorqueBalanced = Math.abs(netTorqueNm) < 0.0015;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-2 font-sans select-none animate-fade-in">
      
      <div className="p-5 sm:p-6 bg-white border border-[#e4e1db] rounded-2xl flex flex-col gap-4 shadow-sm">
        <div className="flex items-start justify-between border-b border-[#e4e1db] pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">Equilibrio traslacional</span>
            <h4 className="text-base font-bold text-stone-800 mt-0.5">
              1ª Condición: Sumatoria de fuerzas
            </h4>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              &Sigma; F<sub>y</sub> = T₁ + T₂ - W<sub>total</sub> = 0
            </div>
          </div>
          <div className={`px-2.5 py-1 flex items-center gap-1 rounded-full text-[11px] font-bold leading-none border ${
            isFBalanced 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isFBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isFBalanced ? 'Fuerzas equilibradas' : 'Desbalance de fuerzas'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#FAF9F5] p-3.5 border border-[#e4decb]/60 rounded-xl">
          <div className="flex flex-col gap-1 border-r border-[#e4e1db] pr-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500">Fuerza ascendente (&uarr;)</span>
            <div className="text-xl font-mono font-bold text-blue-600">
              {formatDec(totalUpForceN, 3)} <span className="text-xs">N</span>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">
              m₁ + m₂ = <span className="text-stone-800 font-bold">{unitSystem === 'si' ? `${formatDec(totalUpMassG/1000, 3)} kg` : `${formatDec(totalUpMassG, 1).replace(/,0$/, '')} g`}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 pl-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500">Fuerza descendente (&darr;)</span>
            <div className="text-xl font-mono font-bold text-red-600">
              {formatDec(totalDownForceN, 3)} <span className="text-xs">N</span>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">
              Pesos = <span className="text-stone-800 font-bold">{unitSystem === 'si' ? `${formatDec(totalDownMassG/1000, 3)} kg` : `${formatDec(totalDownMassG, 1).replace(/,0$/, '')} g`}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Desglose de fuerzas de tensión y peso:</span>
          <div className="space-y-1.5 text-xs font-mono">
            {upForces.map((f, idx) => (
              <div key={`ledger-upf-${idx}`} className="flex justify-between items-center py-1.5 px-2.5 bg-blue-50/50 text-stone-700 rounded border border-blue-100/60">
                <span className="flex items-center gap-1.5"><span className="text-blue-600 font-bold">&uarr;</span> {f.name}</span>
                <span className="text-blue-700 font-bold">+{formatDec(f.val, 3)} N <span className="text-[9px] font-normal text-stone-500">({unitSystem === 'si' ? `${formatDec(f.mass/1000, 3)} kg` : `${formatDec(f.mass, 1).replace(/,0$/, '')} g`})</span></span>
              </div>
            ))}
            {downForces.map((f, idx) => (
              <div key={`ledger-dwf-${idx}`} className="flex justify-between items-center py-1.5 px-2.5 bg-red-50/50 text-stone-700 rounded border border-red-100/60">
                <span className="flex items-center gap-1.5"><span className="text-red-600 font-bold">&darr;</span> {f.name}</span>
                <span className="text-red-700 font-bold">-{formatDec(f.val, 3)} N <span className="text-[9px] font-normal text-stone-500">({unitSystem === 'si' ? `${formatDec(f.mass/1000, 3)} kg` : `${formatDec(f.mass, 1).replace(/,0$/, '')} g`})</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-[#e4e1db] flex items-center justify-between text-xs font-mono">
          <span className="text-stone-500">Fuerza vertical neta (&Sigma; F<sub>y</sub>):</span>
          <span className={`text-sm font-bold ${isFBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isFBalanced ? '0,000 N' : `${formatDec(totalUpForceN - totalDownForceN, 3)} N`}
            {!isFBalanced && (
              <span className="text-[9px] block font-normal text-right text-stone-400 mt-0.5">
                {totalUpForceN > totalDownForceN 
                  ? `Exceso vertical de ${formatDec(totalUpForceN - totalDownForceN, 2)} N (el sistema se elevará)` 
                  : `Sobrecarga de ${formatDec(totalDownForceN - totalUpForceN, 2)} N (el sistema vencerá la tensión y caerá)`}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 bg-white border border-[#e4e1db] rounded-2xl flex flex-col gap-4 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#e4e1db] pb-3 gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-sky-600">Equilibrio rotacional</span>
            <h4 className="text-base font-bold text-stone-800 mt-0.5">
              2ª Condición: Torque neto (&Sigma;&tau;<sub>p</sub>)
            </h4>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              &Sigma; &tau;<sub>p</sub> = &tau;<sub>antihorario</sub> - &tau;<sub>horario</sub> = 0
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-[#FAF9F5] px-2 py-0.5 rounded-lg border border-[#e4e1db]">
              <Anchor className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[9px] uppercase font-mono text-stone-500">Punto pivote:</span>
              <select
                value={pivot}
                onChange={(e) => onChangePivot(Number(e.target.value))}
                className="bg-transparent text-xs text-sky-700 font-black focus:outline-none border-none cursor-pointer p-1.5 select-none"
                title="Elegir punto pivote para cálculo de momentos"
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const val = Math.round((idx * rulerLength) / 4);
                  return (
                    <option key={`pivot-opt-${val}`} value={val} className="text-[#2c2a29]">
                      {unitSystem === 'si' ? `${formatDec(val/100, 2)} m` : `${val} cm`} {idx === 2 ? '(centro)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={`px-2.5 py-1.5 flex items-center gap-1 rounded-full text-[11px] font-bold leading-none border ${
              isTorqueBalanced 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isTorqueBalanced ? 'Equilibrado' : 'Torque neto'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#FAF9F5] p-3.5 border border-[#e4decb]/60 rounded-xl">
          <div className="flex flex-col gap-1 border-r border-[#e4e1db] pr-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              Antihorario (↺ +)
            </span>
            <div className="text-xl font-mono font-bold text-sky-600">
              {formatDec(ccwSumNm, 3)} <span className="text-xs">N&middot;m</span>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">
              = equiv. <span className="text-stone-800 font-semibold">{ccwSumGcm.toLocaleString()}</span> g&middot;cm
            </div>
          </div>

          <div className="flex flex-col gap-1 pl-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1">
              Horario (↻ -)
            </span>
            <div className="text-xl font-mono font-bold text-rose-600">
              {formatDec(cwSumNm, 3)} <span className="text-xs">N&middot;m</span>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">
              = equiv. <span className="text-stone-800 font-semibold">{cwSumGcm.toLocaleString()}</span> g&middot;cm
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#e4e1db] text-stone-400 text-[9px] uppercase tracking-wider">
                <th className="pb-1.5">Fuerza</th>
                <th className="pb-1.5 text-center">x ({unitSystem === 'si' ? 'm' : 'cm'})</th>
                <th className="pb-1.5 text-center">d ({unitSystem === 'si' ? 'm' : 'cm'})</th>
                <th className="pb-1.5 text-center">Sentido</th>
                <th className="pb-1.5 text-right">Momentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fafafa] text-stone-700">
              {torqueItems.map((item, idx) => {
                const distScaled = unitSystem === 'si' ? item.distanceM : item.distanceCm;
                return (
                   <tr key={`trow-${idx}`} className={`hover:bg-[#faf9eb]/50 ${item.direction === 'nulo' ? 'opacity-35' : ''}`}>
                    <td className="py-2.5 font-sans font-semibold text-stone-800 text-xs truncate max-w-[124px]">
                      {item.name}
                    </td>
                    <td className="py-2.5 text-center text-stone-500">
                      {unitSystem === 'si' ? formatDec(item.posCm/100, 2) : item.posCm}
                    </td>
                    <td className="py-2.5 text-center text-stone-800 font-bold">
                      {formatDec(distScaled, 2)}
                    </td>
                    <td className="py-2.5 text-center">
                      {item.direction === 'antihorario' && <span className="text-sky-600 font-bold text-[10px]">↺ CCW</span>}
                      {item.direction === 'horario' && <span className="text-rose-600 font-bold text-[10px]">↻ CW</span>}
                      {item.direction === 'nulo' && <span className="text-stone-400">&mdash;</span>}
                    </td>
                    <td className="py-2.5 text-right font-black text-stone-800 text-[11px]">
                      {item.direction === 'nulo' 
                        ? '0,000' 
                        : `${item.direction === 'horario' ? '-' : '+'}${unitSystem === 'si' ? formatDec(item.torqueNm, 3) + ' N·m' : item.torqueGcm.toLocaleString() + ' g·cm'}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pt-3 border-t border-[#e4e1db] flex items-center justify-between text-xs font-mono">
          <span className="text-stone-500">Torque neto resultante (&Sigma;&tau;<sub>p</sub>):</span>
          <span className={`text-sm font-bold ${isTorqueBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isTorqueBalanced ? '0,000 N·m' : `${formatDec(netTorqueNm, 3)} N·m`}
            <span className="text-[9px] block font-normal text-right text-stone-400 mt-0.5">
              {isTorqueBalanced 
                ? 'Sistema equilibrado en rotación' 
                : `${netTorqueNm > 0 ? 'Rotará en sentido antihorario' : 'Rotará en sentido horario'}`}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
