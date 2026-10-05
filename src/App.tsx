import { useState } from 'react';
import type { PhysicsParams, HangingWeight } from './types';
import { DEFAULT_PARAMS, DEFAULT_WEIGHTS, WEIGHT_COLORS } from './config/simulatorDefaults';
import { WeightCoordinateInput, WeightMassInput, ParamDecimalInput } from './components/inputs/NumericInputs';
import { formatDec } from './utils/format';
import { PhysicsVisualizer } from './components/simulator/PhysicsVisualizer';
import { MathExplanation } from './components/learning/MathExplanation';
import { LabGuides } from './components/learning/LabGuides';
import { DocumentationModal } from './components/learning/DocumentationModal';
import { ParadoxWarning } from './components/simulator/ParadoxWarning';
import {
  Scale, RefreshCw, Plus, Trash2, Sliders, AlertTriangle,
  Atom, Trophy, Binary, BookOpen, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  calcEquilibrium, resolveWeightOverlapList, getMinWeightDistance,
  solveAll, solveM1, solveM2,
} from './utils/physics';


export default function App() {
  const [params, setParams] = useState<PhysicsParams>(DEFAULT_PARAMS);
  const [weights, setWeights] = useState<HangingWeight[]>(DEFAULT_WEIGHTS);
  const [hiddenDclBodies, setHiddenDclBodies] = useState<string[]>(['ruler', 't1', 't2', 'preset-c-1']);
  const [showRotationSenses, setShowRotationSenses] = useState(false);
  const [isDclMenuOpen, setIsDclMenuOpen] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'cgs' | 'si'>('cgs');
  const [activeTab, setActiveTab] = useState<'controls' | 'equations' | 'challenges'>('controls');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [addMass, setAddMass] = useState<number>(100);

  const allDclBodies = ['ruler', 't1', 't2', ...weights.map(w => w.id)];
  const showDCL = allDclBodies.some(id => !hiddenDclBodies.includes(id));

  const eq = calcEquilibrium(params, weights);
  const { t1Val, t2Val, rulerWVal, totalDownWVal, fNetY, torqueNet, isFBalanced, isTorqueBalanced } = eq;

  const isSymmetricTensors = params.m1 === params.m2;
  const showParadoxWarning = isSymmetricTensors && !isFBalanced;


  const handleChangeParams = (updates: Partial<PhysicsParams>) => {
    setParams(prev => {
      const next = { ...prev, ...updates };
      if (updates.rulerLength && prev.pivot > updates.rulerLength) next.pivot = updates.rulerLength / 2;
      return next;
    });
  };

  const handleAddWeight = (mass: number, x: number) => {
    if (weights.length >= 5) return;
    const existingNames = new Set(weights.map(w => w.name));
    let name = 'A';
    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      if (!existingNames.has(c)) { name = c; break; }
    }
    const existingColors = new Set(weights.map(w => w.color));
    const color = WEIGHT_COLORS.find(c => !existingColors.has(c)) ?? WEIGHT_COLORS[0];
    const newId = `w-${Date.now()}`;
    const newWeight: HangingWeight = { id: newId, mass, x: Math.min(params.rulerLength, Math.max(0, x)), color, name };
    setHiddenDclBodies(prev => [...prev, newId]);
    setWeights(prev => resolveWeightOverlapList([...prev, newWeight], newId, params.rulerLength));
  };

  const handleUpdateWeightPos = (id: string, x: number) => {
    setWeights(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, x: Math.min(params.rulerLength, Math.max(0, x)) } : w);
      return resolveWeightOverlapList(updated, id, params.rulerLength);
    });
  };

  const handleUpdateWeight = (id: string, updates: Partial<HangingWeight>) => {
    setWeights(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, ...updates } : w);
      if (updates.x !== undefined || updates.mass !== undefined)
        return resolveWeightOverlapList(updated, id, params.rulerLength);
      return updated;
    });
  };

  const handleRemoveWeight = (id: string) => {
    setWeights(prev => prev.filter(w => w.id !== id));
  };

  const handleJumpWeight = (id: string, direction: 'left' | 'right') => {
    setWeights(prev => {
      const cur = prev.find(w => w.id === id);
      if (!cur) return prev;
      const sorted = [...prev].sort((a, b) => a.x - b.x);
      const idx = sorted.findIndex(w => w.id === id);
      if (direction === 'left' && idx > 0) {
        const nb = sorted[idx - 1];
        const d = getMinWeightDistance(cur.mass, nb.mass, params.rulerLength);
        return resolveWeightOverlapList(prev.map(w => w.id === id ? { ...w, x: Math.max(0, nb.x - d - 0.1) } : w), id, params.rulerLength);
      }
      if (direction === 'right' && idx < sorted.length - 1) {
        const nb = sorted[idx + 1];
        const d = getMinWeightDistance(cur.mass, nb.mass, params.rulerLength);
        return resolveWeightOverlapList(prev.map(w => w.id === id ? { ...w, x: Math.min(params.rulerLength, nb.x + d + 0.1) } : w), id, params.rulerLength);
      }
      return prev;
    });
  };

  const handleAutoEquilibrateAll = () => {
    const { m1, m2 } = solveAll(params, weights);
    setParams(prev => ({ ...prev, m1, m2 }));
  };

  const handleSolveM1 = () => setParams(prev => ({ ...prev, m1: solveM1(params, weights) }));
  const handleSolveM2 = () => setParams(prev => ({ ...prev, m2: solveM2(params, weights) }));

  const handleResetAll = () => {
    setParams(DEFAULT_PARAMS);
    setWeights(DEFAULT_WEIGHTS);
    setActiveChallengeId(null);
  };

  const handleApplyChallenge = (challenge: any) => {
    const rLen = challenge.setup.rulerLength || 40;
    setParams({ m1: challenge.setup.m1, m2: challenge.setup.m2, rulerMass: challenge.setup.rulerMass, rulerLength: rLen, gravity: 9.81, pivot: challenge.setup.targetPivot || rLen / 2 });
    const startWeights = challenge.setup.weights.map((wi: any, idx: number) => ({
      id: `challenge-w-${idx}-${Date.now()}`,
      mass: wi.mass, x: wi.x,
      color: wi.color || WEIGHT_COLORS[idx % WEIGHT_COLORS.length],
      name: wi.name || String.fromCharCode(65 + idx),
    }));
    setWeights(startWeights);
    setHiddenDclBodies(prev => [...prev.filter(x => x === 'ruler' || x === 't1' || x === 't2'), ...startWeights.map((sw: any) => sw.id)]);
    setActiveChallengeId(challenge.id);
    setActiveTab('challenges');
  };

  const handleResetToSandbox = () => setActiveChallengeId(null);

  const handlePresetSelect = (name: string) => {
    const id = `pw-${Date.now()}`;
    if (name === 'sym-light') {
      setParams({ ...DEFAULT_PARAMS, m1: 150, m2: 150, rulerMass: 100 });
      setWeights([{ id, mass: 200, x: 20, color: '#f59e0b', name: 'A' }]);
      setHiddenDclBodies(prev => [...prev.filter(x => x === 'ruler' || x === 't1' || x === 't2'), id]);
    } else if (name === 'heavy-right') {
      setParams({ ...DEFAULT_PARAMS, m1: 100, m2: 200, rulerMass: 100 });
      setWeights([{ id, mass: 200, x: 30, color: '#dc2626', name: 'P' }]);
      setHiddenDclBodies(prev => [...prev.filter(x => x === 'ruler' || x === 't1' || x === 't2'), id]);
    } else if (name === 'bridge') {
      const id2 = `pw2-${Date.now()}`;
      setParams({ ...DEFAULT_PARAMS, m1: 200, m2: 200, rulerMass: 100 });
      setWeights([{ id, mass: 150, x: 12, color: '#2563eb', name: 'A' }, { id: id2, mass: 150, x: 28, color: '#059669', name: 'B' }]);
      setHiddenDclBodies(prev => [...prev.filter(x => x === 'ruler' || x === 't1' || x === 't2'), id, id2]);
    }
  };

  const equilibriumStatus = { isFBalanced, isTorqueBalanced, fNetY, torqueNet, t1Val, t2Val, rulerWVal, totalDownWVal };

  return (
    <div className="min-h-screen bg-[#f3efe8] text-[#1c1917] flex flex-col antialiased pb-12 selection:bg-amber-100 selection:text-amber-900">
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">

        <div className="flex flex-col md:flex-row items-center justify-between pb-4 border-b border-[#e1dcd5]">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight text-stone-800">Estática y momento de fuerza</h1>
              <p className="text-xs text-stone-500 font-medium">Explorador de laboratorio para las condiciones de equilibrio del cuerpo rígido</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="text-[10px] uppercase font-mono font-bold text-stone-400 mr-1.5 hidden sm:inline">esquemas rápidos:</span>
            <div className="flex gap-1.5 bg-[#eae5dc] p-1 rounded-xl border border-[#dcd6ca]">
              <button onClick={() => handlePresetSelect('sym-light')} disabled={!!activeChallengeId} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#57534e] hover:text-stone-800 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer">simétrico</button>
              <button onClick={() => handlePresetSelect('heavy-right')} disabled={!!activeChallengeId} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#57534e] hover:text-stone-800 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer">asimétrico</button>
              <button onClick={() => handlePresetSelect('bridge')} disabled={!!activeChallengeId} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#57534e] hover:text-stone-800 disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer">múltiple</button>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col">
          <PhysicsVisualizer
            params={params} weights={weights}
            onUpdateWeightPos={handleUpdateWeightPos}
            onRemoveWeight={handleRemoveWeight}
            showDCL={showDCL} hiddenDclBodies={hiddenDclBodies}
            unitSystem={unitSystem} showRotationSenses={showRotationSenses}
            equilibriumStatus={equilibriumStatus}
          />

          <div className="w-full flex justify-center mt-3.5 z-10">
            <div className="px-4 py-2.5 bg-white border border-stone-200/60 rounded-2xl flex flex-wrap items-center justify-center gap-3 md:gap-4 xl:gap-6 shadow-md max-w-full">

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400">regla:</span>
                <select value={params.rulerLength} onChange={e => handleChangeParams({ rulerLength: Number(e.target.value) })} disabled={!!activeChallengeId} className="bg-stone-100 hover:bg-stone-200 border border-stone-200 text-[#44403c] font-bold py-0.5 px-2 rounded text-[10px] uppercase cursor-pointer focus:outline-none">
                  <option value="40">40 cm (estándar)</option>
                  <option value="60">60 cm (larga)</option>
                  <option value="80">80 cm (extra larga)</option>
                  <option value="100">100 cm (métrica/1 m)</option>
                </select>
              </div>

              <div className="hidden xl:block h-4 w-px bg-stone-200" />

              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 pr-1.5">unidades:</span>
                <button onClick={() => setUnitSystem('cgs')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition uppercase cursor-pointer ${unitSystem === 'cgs' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-[#44403c] border border-stone-200 hover:bg-stone-200'}`}>g / cm</button>
                <button onClick={() => setUnitSystem('si')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition uppercase cursor-pointer ${unitSystem === 'si' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-[#44403c] border border-stone-200 hover:bg-stone-200'}`}>kg / m</button>
              </div>

              <div className="hidden xl:block h-4 w-px bg-stone-200" />

              <div className="relative">
                <button onClick={() => setIsDclMenuOpen(!isDclMenuOpen)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${showDCL || showRotationSenses ? 'bg-amber-600 text-white shadow-sm' : 'bg-stone-100 border border-stone-200 text-[#44403c] hover:bg-stone-200'}`}>
                  <Atom className="w-3.5 h-3.5 animate-pulse" />
                  <span>DCL</span>
                  <span className="text-[8px] opacity-75">{isDclMenuOpen ? '▲' : '▼'}</span>
                </button>
                {isDclMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsDclMenuOpen(false)} />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-58 bg-white border border-stone-200 rounded-xl shadow-xl p-3 z-40 text-xs font-sans text-stone-700 flex flex-col gap-2 animate-zoom-in">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <span className="font-bold text-stone-800">Diagramas de Cuerpo Libre (DCL)</span>
                      </div>
                      <div className="text-[10px] leading-relaxed bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-100">
                        <strong>Tip:</strong> Puedes arrastrar los cuadros del DCL para ubicarlos mejor. Haz doble clic para restaurar la posición.
                      </div>
                      <div className="flex flex-col gap-1.5 align-start text-left">
                        {[
                          { id: 'ruler', label: 'Regla madera (c.g.)' },
                          { id: 't1', label: 'Polea izquierda (T₁)' },
                          { id: 't2', label: 'Polea derecha (T₂)' },
                        ].map(({ id, label }) => (
                          <label key={id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-stone-50 text-left">
                            <input type="checkbox" checked={!hiddenDclBodies.includes(id)} onChange={() => setHiddenDclBodies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} className="rounded border-stone-300 w-3.5 h-3.5 accent-amber-600" />
                            <span>{label}</span>
                          </label>
                        ))}
                        {weights.length > 0 && <div className="border-t border-stone-100 my-1 pt-1.5 text-[9px] uppercase tracking-wider font-bold text-stone-400">Cargas colgadas</div>}
                        {weights.map(w => (
                          <label key={w.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-stone-50 text-left">
                            <input type="checkbox" checked={!hiddenDclBodies.includes(w.id)} onChange={() => setHiddenDclBodies(prev => prev.includes(w.id) ? prev.filter(x => x !== w.id) : [...prev, w.id])} className="rounded border-stone-300 w-3.5 h-3.5 accent-amber-600" />
                            <span>Carga {w.name} ({unitSystem === 'si' ? `${formatDec(w.mass / 1000, 2)} kg` : `${w.mass} g`})</span>
                          </label>
                        ))}
                        <div className="border-t border-stone-100 my-1 pt-1.5 text-[9px] uppercase tracking-wider font-bold text-stone-400">Sentidos de rotación</div>
                        <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-stone-50 text-left">
                          <input type="checkbox" checked={showRotationSenses} onChange={() => setShowRotationSenses(p => !p)} className="rounded border-stone-300 w-3.5 h-3.5 accent-amber-600" />
                          <span>Sentidos (↺ / ↻)</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden xl:block h-4 w-px bg-stone-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400">cargas:</span>
                <div className="flex items-center bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
                  <span className="text-[9px] uppercase font-bold text-stone-400 mr-1 select-none">Masa:</span>
                  <input type="number" min="10" max="500" step="0.1" value={addMass}
                    onChange={e => { const v = e.target.value === '' ? '' : Number(e.target.value); setAddMass(v === '' ? '' as any : v as number); }}
                    onBlur={() => setAddMass(prev => Math.max(10, Math.min(500, Number(prev) || 100)))}
                    className="w-11 bg-transparent text-right font-mono text-[10px] font-bold text-[#44403c] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none p-0 h-4"
                  />
                  <span className="text-[9px] text-stone-500 font-bold ml-1">g</span>
                </div>
                <button onClick={() => handleAddWeight(Number(addMass) || 100, params.rulerLength / 2)} disabled={weights.length >= 5}
                  className={`flex items-center gap-1 px-2.5 py-0.5 text-white rounded text-[10px] font-bold transition shadow-sm cursor-pointer ${weights.length >= 5 ? 'bg-stone-300 text-stone-500 cursor-not-allowed border border-stone-200' : 'bg-amber-600 hover:bg-amber-500'}`}>
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>

              <div className="hidden xl:block h-4 w-px bg-stone-200" />

              <div className="flex items-center gap-1">
                <button onClick={handleResetAll} className="p-1 px-2 text-[#78716c] hover:text-stone-800 hover:bg-[#FAF9F5] rounded-lg transition cursor-pointer" title="Reiniciar banco de laboratorio">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setIsDocsOpen(true)} className="p-1 px-2 text-[#78716c] hover:text-amber-600 hover:bg-[#FAF9F5] rounded-lg transition cursor-pointer flex items-center justify-center" title="Documentación científica">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <ParadoxWarning
          show={showParadoxWarning}
          params={params}
          weights={weights}
          isFBalanced={isFBalanced}
          unitSystem={unitSystem}
        />

        <div className="w-full flex-col flex mt-2 bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="flex border-b border-[#eadecb] bg-[#faf9f5]">
            {(['controls', 'equations', 'challenges'] as const).map((tab, i) => {
              const icons = [<Sliders className="w-4 h-4" />, <Binary className="w-4 h-4" />, <Trophy className="w-4 h-4" />];
              const labels = ['Controles y cargas', 'Matemática y fórmulas', 'Desafíos del laboratorio'];
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-initial px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition ${activeTab === tab ? 'border-amber-600 bg-white text-stone-800' : 'border-transparent text-stone-500 hover:text-stone-800'}`}>
                  {icons[i]} {labels[i]}
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6 bg-white shrink">

            {activeTab === 'controls' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="bg-[#FAF9F5] p-3.5 sm:p-4.5 border border-[#eadecb]/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-stone-800">Opciones de torsión automáticas</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5 font-sans">Configuraciones automáticas para equilibrar momentos</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button onClick={handleAutoEquilibrateAll} className="py-1.5 px-3 bg-[#eadecb] hover:bg-amber-600 hover:text-white text-stone-700 font-bold transition text-xs rounded-lg border border-[#c9beae] cursor-pointer">Autocalcular equilibrio total</button>
                    <button onClick={handleSolveM1} className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg transition cursor-pointer">Calcular m₁ requerida</button>
                    <button onClick={handleSolveM2} className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-bold rounded-lg transition cursor-pointer">Calcular m₂ requerida</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 border border-[#eadecb]/60 bg-[#FAF9F5] rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-black text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Polea izquierda (m₁)</span>
                      <div className="flex items-center gap-1">
                        <ParamDecimalInput value={params.m1} min={50} max={1000} unitSystem={unitSystem} onChange={val => handleChangeParams({ m1: val })} className="w-16 bg-white border border-stone-300 rounded text-right px-1.5 py-0.5 font-mono text-xs font-black text-stone-800 focus:outline-none focus:border-amber-600 animate-fade-in" />
                        <span className="text-[10px] text-stone-500 font-bold">g</span>
                      </div>
                    </div>
                    <input type="range" min="50" max="1000" step="0.1" value={params.m1} onChange={e => handleChangeParams({ m1: Number(e.target.value) })} className="w-full accent-blue-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono"><span>mín: 50 g</span><span>máx: 1000 g</span></div>
                  </div>

                  <div className="p-4 border border-[#eadecb]/60 bg-[#FAF9F5] rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-black text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Polea derecha (m₂)</span>
                      <div className="flex items-center gap-1">
                        <ParamDecimalInput value={params.m2} min={50} max={1000} unitSystem={unitSystem} onChange={val => handleChangeParams({ m2: val })} className="w-16 bg-white border border-stone-300 rounded text-right px-1.5 py-0.5 font-mono text-xs font-black text-stone-800 focus:outline-none focus:border-amber-600 animate-fade-in" />
                        <span className="text-[10px] text-stone-500 font-bold">g</span>
                      </div>
                    </div>
                    <input type="range" min="50" max="1000" step="0.1" value={params.m2} onChange={e => handleChangeParams({ m2: Number(e.target.value) })} className="w-full accent-emerald-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono"><span>mín: 50 g</span><span>máx: 1000 g</span></div>
                  </div>

                  <div className="p-4 border border-[#eadecb]/60 bg-[#FAF9F5] rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800">Masa propia de la regla</span>
                      <div className="flex items-center gap-1">
                        <ParamDecimalInput value={params.rulerMass} min={50} max={1000} unitSystem={unitSystem} onChange={val => handleChangeParams({ rulerMass: val })} disabled={!!activeChallengeId} className="w-16 bg-white border border-stone-300 rounded text-right px-1.5 py-0.5 font-mono text-xs font-black text-stone-800 focus:outline-none focus:border-amber-600 disabled:opacity-50 animate-fade-in" />
                        <span className="text-[10px] text-stone-500 font-bold">g</span>
                      </div>
                    </div>
                    <input type="range" min="50" max="1000" step="0.1" value={params.rulerMass} onChange={e => handleChangeParams({ rulerMass: Number(e.target.value) })} disabled={!!activeChallengeId} className="w-full accent-amber-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                      <span>centro de gravedad: {params.rulerLength / 2} cm</span><span>máx: 1000 g</span>
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden mt-2">
                  <div className="bg-stone-50 p-3 px-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#57534e]">Cargas instaladas sobre la barra de torsión</h4>
                      <p className="text-[10px] text-stone-500">Haz clic y desliza las cargas sobre el simulador o modifícalas aquí abajo:</p>
                    </div>
                    <span className="text-xs font-bold text-stone-600 font-mono bg-stone-200/60 px-2.5 py-1 rounded-lg self-start sm:self-center">
                      Suma de pesos: {formatDec(weights.reduce((s, w) => s + w.mass, 0), 2)} g (Cargas: {weights.length}/5)
                    </span>
                  </div>
                  {weights.length === 0 ? (
                    <div className="p-8 text-center text-xs text-stone-400">No hay cargas adicionales suspendidas de la regla. Haz clic en "Agregar carga" del menú flotante para empezar.</div>
                  ) : (
                    <div className="divide-y divide-[#fafafa]">
                      {(() => {
                        const sorted = [...weights].sort((a, b) => a.x - b.x);
                        return weights.map(w => {
                          const si = sorted.findIndex(item => item.id === w.id);
                          return (
                            <div key={w.id} className="p-4 px-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#faf9f6]">
                              <div className="flex items-center gap-3 min-w-[120px]">
                                <span className="w-3.5 h-3.5 rounded-full border border-stone-800 shrink-0" style={{ backgroundColor: w.color }} />
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-stone-800">Carga {w.name}</span>
                                  {weights.length > 1 && (
                                    <div className="flex items-center gap-1 mt-1 font-sans">
                                      <button disabled={si === 0} onClick={() => handleJumpWeight(w.id, 'left')} className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold flex items-center gap-0.5 transition ${si > 0 ? 'border-stone-200 bg-white hover:bg-stone-100 text-stone-600 cursor-pointer' : 'border-stone-100 bg-stone-50/50 text-stone-300 cursor-not-allowed opacity-50'}`}>
                                        <ChevronLeft className="w-3 h-3" /><span>Izq</span>
                                      </button>
                                      <button disabled={si === sorted.length - 1} onClick={() => handleJumpWeight(w.id, 'right')} className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold flex items-center gap-0.5 transition ${si < sorted.length - 1 ? 'border-stone-200 bg-white hover:bg-stone-100 text-stone-600 cursor-pointer' : 'border-stone-100 bg-stone-50/50 text-stone-300 cursor-not-allowed opacity-50'}`}>
                                        <span>Der</span><ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-stone-400">Coordenada x ({unitSystem === 'si' ? 'm' : 'cm'}):</span>
                                    <span className="text-[9px] text-stone-400 font-mono">rango: 0 - {unitSystem === 'si' ? formatDec(params.rulerLength / 100, 2) : params.rulerLength}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="range" min="0" max={params.rulerLength} step="0.1" value={w.x} onChange={e => handleUpdateWeight(w.id, { x: Number(e.target.value) })} className="flex-1 accent-red-700 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" />
                                    <WeightCoordinateInput weightId={w.id} xValue={w.x} rulerLength={params.rulerLength} unitSystem={unitSystem} onChange={handleUpdateWeight} />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-stone-400">Masa (g):</span>
                                    <span className="text-[9px] text-stone-400 font-mono">{unitSystem === 'si' ? 'máx: 0.500 kg' : 'máx: 500 g'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input type="range" min="10" max="500" step="0.1" value={w.mass} onChange={e => handleUpdateWeight(w.id, { mass: Number(e.target.value) })} className="flex-1 accent-red-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" />
                                    <WeightMassInput weightId={w.id} massValue={w.mass} unitSystem={unitSystem} onChange={handleUpdateWeight} />
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleRemoveWeight(w.id)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer self-end lg:self-center shrink-0" title="Retirar de la regla">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'equations' && (
              <div className="animate-fade-in transition-all duration-300">
                <MathExplanation params={params} weights={weights} onChangePivot={pivot => handleChangeParams({ pivot })} unitSystem={unitSystem} equilibriumStatus={equilibriumStatus} />
              </div>
            )}

            {activeTab === 'challenges' && (
              <div className="animate-fade-in">
                <LabGuides params={params} weights={weights} onApplyChallenge={handleApplyChallenge} onResetToSandbox={handleResetToSandbox} activeChallengeId={activeChallengeId} unitSystem={unitSystem} />
              </div>
            )}
          </div>
        </div>

      </main>

      <DocumentationModal open={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      <footer className="mt-12 text-center text-xs text-[#78716c] font-mono flex flex-col gap-1 items-center">
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <BookOpen className="w-3.5 h-3.5" /> Módulo de estática - física de ingeniería
        </div>
      </footer>
    </div>
  );
}
