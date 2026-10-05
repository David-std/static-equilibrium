import { FileText } from 'lucide-react';

interface DocumentationModalProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentationModal({ open, onClose }: DocumentationModalProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-stone-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 select-text overflow-y-auto">
          <div className="fixed inset-0 cursor-pointer" onClick={() => onClose()} />
          <div className="relative bg-[#faf9f5] border border-stone-200 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] z-10 animate-zoom-in text-[#1c1917] outline-none">
            <div className="px-6 py-4.5 border-b border-stone-200 flex items-center justify-between bg-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h2 className="text-sm font-black uppercase tracking-wider text-stone-800">Fundamento Teórico e Instructivo del Simulador</h2>
              </div>
              <button onClick={() => onClose()} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer font-bold text-xs">✕</button>
            </div>
            <div className="p-6 overflow-y-auto leading-relaxed text-xs text-stone-700 font-sans flex flex-col gap-6 select-text selection:bg-amber-100 selection:text-amber-900">
              <div className="bg-white border border-[#eadecb] p-4.5 rounded-xl shadow-sm text-[11px]">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#d97706] mb-1">Módulo Científico Oficial de Laboratorio</p>
                <p className="text-stone-600 leading-relaxed">Este simulador modela en tiempo real un <strong>sistema físico acoplado de equilibrio rígido</strong> — una regla graduada suspendida por cables de tensión en poleas extremas. Analiza síncronamente fuerzas coplanares no concurrentes y los momentos resultantes.</p>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2 border-l-2 border-amber-600 pl-2">1. Condiciones Fundamentales del Equilibrio Estático</h3>
                <p className="mb-3 text-stone-600 text-[11px]">Para que un cuerpo rígido permanezca en reposo, debe satisfacer simultáneamente:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-[11px]">
                  <div className="p-3.5 bg-white border border-stone-200 rounded-xl">
                    <p className="font-bold text-blue-600 uppercase tracking-wide text-[10px] mb-1">I. Equilibrio Traslacional (∑F<sub>y</sub> = 0)</p>
                    <p className="text-stone-500 leading-relaxed">Primera Ley de Newton. Las tensiones T₁ y T₂ deben cancelar el peso total descendente.</p>
                    <div className="text-center font-mono my-2 py-1.5 bg-[#FAF9F5] border border-stone-100 rounded text-stone-800 font-bold">∑ F<sub>y</sub> = 0</div>
                  </div>
                  <div className="p-3.5 bg-white border border-stone-200 rounded-xl">
                    <p className="font-bold text-emerald-600 uppercase tracking-wide text-[10px] mb-1">II. Equilibrio Rotacional (∑τ = 0)</p>
                    <p className="text-stone-500 leading-relaxed">La sumatoria de todos los momentos de fuerza respecto a cualquier pivote debe anularse.</p>
                    <div className="text-center font-mono my-2 py-1.5 bg-[#FAF9F5] border border-stone-100 rounded text-stone-800 font-bold">∑ τ = 0</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2 border-l-2 border-amber-600 pl-2">2. Estructura de los DCL</h3>
                <div className="ml-2 flex flex-col gap-3.5">
                  <div className="border border-stone-200/60 p-3.5 bg-white rounded-xl">
                    <h4 className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> A. Fuerzas sobre la Regla</h4>
                    <ul className="list-disc ml-5 text-[11px] text-stone-600 space-y-1">
                      <li><strong>T₁ y T₂:</strong> Fuerzas ascendentes en los extremos.</li>
                      <li><strong>W<sub>regla</sub>:</strong> Peso propio concentrado en L/2.</li>
                      <li><strong>F<sub>A</sub>, F<sub>B</sub>…:</strong> Fuerza de cada carga colgada.</li>
                    </ul>
                  </div>
                  <div className="border border-stone-200/60 p-3.5 bg-white rounded-xl">
                    <h4 className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> B. Fuerzas sobre cada Carga</h4>
                    <ul className="list-disc ml-5 text-[11px] text-stone-600 space-y-1">
                      <li><strong>W<sub>A</sub>:</strong> Peso hacia abajo (m · g).</li>
                      <li><strong>R<sub>A</sub>:</strong> Reacción ascendente del gancho. Por 3ª Ley de Newton: |F<sub>A</sub>| = |R<sub>A</sub>|.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 mb-2 border-l-2 border-amber-600 pl-2">3. Conversión de Unidades</h3>
                <div className="border border-stone-200 rounded-xl bg-white p-4 flex flex-col gap-3 font-mono text-[11px] text-stone-600">
                  <div><span className="font-bold text-stone-900">Fuerza:</span><div className="text-center font-bold text-stone-800 bg-[#FAF9F5] p-2 rounded border border-stone-100 my-1.5 text-xs">F (N) = [masa (g) / 1000] · g (m/s²)</div></div>
                  <div><span className="font-bold text-stone-900">Torque:</span><div className="text-center font-bold text-stone-800 bg-[#FAF9F5] p-2 rounded border border-stone-100 my-1.5 text-xs">τ (N·m) = F (N) · [|x<sub>fuerza</sub> - x<sub>pivote</sub>| / 100]</div></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-200 bg-white rounded-b-2xl flex items-center justify-end">
              <button onClick={() => onClose()} className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer">Entendido, Cerrar Guía</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
