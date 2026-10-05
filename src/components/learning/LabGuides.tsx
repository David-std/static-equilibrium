/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { PhysicsParams, HangingWeight } from '../../types';
import { Trophy, Play, Lightbulb, GraduationCap } from 'lucide-react';

interface LabGuidesProps {
  params: PhysicsParams;
  weights: HangingWeight[];
  onApplyChallenge: (setup: any) => void;
  onResetToSandbox: () => void;
  activeChallengeId: string | null;
  unitSystem: 'cgs' | 'si';
}

interface Challenge {
  id: string;
  title: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  description: string;
  instructions: string;
  targetExplanation: string;
  setup: {
    m1: number;
    m2: number;
    rulerMass: number;
    rulerLength?: number;
    weights: { mass: number; x: number; name: string; color: string }[];
  };
  validate: (params: PhysicsParams, weights: HangingWeight[]) => { isSolved: boolean; hint: string };
}

export const LabGuides: React.FC<LabGuidesProps> = ({
  params,
  weights,
  onApplyChallenge,
  onResetToSandbox,
  activeChallengeId,
  unitSystem,
}) => {
  const [showHint, setShowHint] = useState<string | null>(null);

  const challenges: Challenge[] = [
    {
      id: 'eq-basico',
      title: 'Desafío 1: el equilibrio simétrico',
      difficulty: 'fácil',
      description: 'Suspende una regla pesada sin ninguna carga adicional. Encuentra la distribución de fuerzas de polea ideal.',
      instructions: 'La regla tiene una masa de 150 g (que actúa como peso propio a los 20 cm). Teniendo las cuerdas de apoyo en los extremos (0 cm y 40 cm), calcula y coloca el valor de las fuerzas de las poleas m1 (izquierda) y m2 (derecha) para lograr el equilibrio horizontal perfecto.',
      targetExplanation: 'Objetivo: m1 y m2 deben soportar por igual la regla y mantenerse en equilibrio.',
      setup: {
        m1: 50,
        m2: 50,
        rulerMass: 150,
        rulerLength: 40,
        weights: [],
      },
      validate: (p, w) => {
        if (w.length > 0) {
          return {
            isSolved: false,
            hint: '¡No debe haber ninguna carga extra colgada de la regla para este desafío! Por favor, elimina las cargas adicionales.',
          };
        }
        if (p.m1 === 75 && p.m2 === 75) {
          return { isSolved: true, hint: '¡Excelente! Ambos lados cargan 75 g (o 0.075 kg) de forma simétrica: m1 = m2 = 150 g / 2.' };
        }
        return {
          isSolved: false,
          hint: 'pista: la regla pesa 150 g en total. Al estar el centro de gravedad alineado a la mitad exacta (20 cm), cada tensor extremo carga la mitad exacta de su peso.',
        };
      },
    },
    {
      id: 'carga-asimetrica',
      title: 'Desafío 2: la carga descentrada',
      difficulty: 'medio',
      description: 'Una masa importante cuelga cerca del extremo izquierdo. ¿Cómo deben responder las tensiones de soporte?',
      instructions: 'La regla tiene una masa de 100 g. Hemos colgado una masa asimétrica de 200 g a la distancia de 10 cm. Investiga qué valores deben tener las masas de poleas m1 (izquierda) y m2 (derecha) para suspender la regla a nivel horizontal.',
      targetExplanation: 'Objetivo: lograr fuerzas y torques nulos con m1 y m2 correctos.',
      setup: {
        m1: 100,
        m2: 100,
        rulerMass: 100,
        rulerLength: 40,
        weights: [{ mass: 200, x: 10, name: 'A', color: '#f59e0b' }],
      },
      validate: (p, w) => {
        const targetWeight = w.find((wi) => wi.mass === 200 && wi.x === 10);
        if (!targetWeight) {
          return {
            isSolved: false,
            hint: 'Se requiere que exista una carga de 200 g en la posición de 10 cm. Puedes hacer clic en "Reiniciar reto" para cargar el escenario.',
          };
        }
        if (w.length > 1) {
          return {
            isSolved: false,
            hint: 'Elimina las cargas que no forman parte del reto (solo debe estar la carga de 200 g en la marca de 10 cm).',
          };
        }
        if (p.m1 === 200 && p.m2 === 100) {
          return {
            isSolved: true,
            hint: '¡Felicidades! Resolviste la torque y peso: sumando momentos en x = 0, m2 * 40 cm = 100 g * 20 cm + 200 g * 10 cm => m2 = 100 g. Por tanto m1 = 100 g + 200 g - 100 g = 200 g.',
          };
        }
        return {
          isSolved: false,
          hint: 'pista: calcula momentos respecto a la articulación izquierda x = 0. El torque horario lo ejercen la regla (100 g * 20 cm) y la carga (200 g * 10 cm). Despeja m2 y luego m1.',
        };
      },
    },
    {
      id: 'contrapeso-misterioso',
      title: 'Desafío 3: el contrapeso oculto',
      difficulty: 'difícil',
      description: 'Resuelve un sistema donde una fuerza lateral está fija y debes deslizar una carga a su lugar exacto.',
      instructions: 'La regla pesa 120 g. La polea izquierda m1 está bloqueada/fijada en 150 g. Hay una carga fija de 180 g en los 30 cm. Debes hacer dos cosas: 1) Ajustar la polea derecha m2, y 2) Añadir una única carga adicional de exactamente 50 g sobre la regla y arrastrarla (deslizarla) hasta la coordenada cm precisa que estabilice el sistema.',
      targetExplanation: 'Objetivo: configurar m2 y ubicar la carga de 50 g en el centímetro correcto.',
      setup: {
        m1: 150,
        m2: 120,
        rulerMass: 120,
        rulerLength: 40,
        weights: [{ mass: 180, x: 30, name: 'Principal', color: '#dc2626' }],
      },
      validate: (p, w) => {
        const w180 = w.find((wi) => wi.mass === 180 && wi.x === 30);
        const w50 = w.find((wi) => wi.mass === 50);

        if (p.m1 !== 150) {
          return {
            isSolved: false,
            hint: '¡Cuidado! El desafío estipula que m1 debe estar fija en 150 g de masa.',
          };
        }
        if (!w180) {
          return {
            isSolved: false,
            hint: 'La carga de 180 g a los 30 cm ha sido movida o eliminada. Haz clic en "Reiniciar reto".',
          };
        }
        if (!w50) {
          return {
            isSolved: false,
            hint: 'Debes añadir una nueva carga de 50 g a la regla y arrastrarla (deslizarla) hasta su lugar adecuado.',
          };
        }
        if (w.length > 2) {
          return {
            isSolved: false,
            hint: 'Tienes demasiadas cargas sobre la regla. Solo debe estar la de 180 g en 30 cm y la nueva de 50 g que agregaste.',
          };
        }

        if (p.m2 === 200 && w50.x === 4) {
          return {
            isSolved: true,
            hint: '¡Extraordinario! Lograste m2 = 200 g y localizaste que el contrapeso de 50 g debe colgar a exactamente 4 cm. La fuerza neta cierra a 150 + 200 = 120 + 180 + 50 = 350 g, y los torques cancelan a cero.',
          };
        }

        if (p.m2 !== 200) {
          return {
            isSolved: false,
            hint: 'La fuerza hacia arriba total para equilibrar los pesos (120 g regla + 180 g carga + 50 g nueva = 350 g) requiere que m1 + m2 = 350 g. Como m1 = 150 g, calcula cuánto debe valer m2 primero.',
          };
        }

        return {
          isSolved: false,
          hint: '¡Ya tienes m2 = 200 g correcto! Ahora arrastra la carga de 50 g a lo largo de la regla. Observa el torque neto en el panel de cálculos; ¡muévela hasta que el torque neto sea exactamente 0.000!',
        };
      },
    },
    {
      id: 'puzzle-extremo',
      title: 'Desafío 4: el gran balance industrial',
      difficulty: 'difícil',
      description: 'Equilibra una regla pesada con un yunque de laboratorio de 300 g suspendido a la derecha.',
      instructions: 'La regla tiene 200 g de masa. Hay un peso de 300 g colocado en la marca de 32 cm. Tu tarea es calcular las condiciones de equilibrio y ajustar m1 y m2 a sus valores exactos para suspender el sistema horizontalmente sin que se balancee.',
      targetExplanation: 'Objetivo: m1 y m2 exactos para equilibrar 300 g descentrado a la derecha.',
      setup: {
        m1: 100,
        m2: 100,
        rulerMass: 200,
        rulerLength: 40,
        weights: [{ mass: 300, x: 32, name: 'Yunque', color: '#2563eb' }],
      },
      validate: (p, w) => {
        const w300 = w.find((wi) => wi.mass === 300 && wi.x === 32);
        if (!w300 || w.length > 1) {
          return {
            isSolved: false,
            hint: 'Asegúrate de tener únicamente la carga de 300 g a los 32 cm sobre la regla para validar.',
          };
        }
        if (p.m1 === 160 && p.m2 === 340) {
          return {
            isSolved: true,
            hint: '¡Perfecto! El equilibrio de torque respecto a x = 0 da: m2*40 = 200*20 + 300*32 => m2 = 340 g. Por equilibrio traslacional, m1 = 200 + 300 - 340 = 160 g.',
          };
        }
        return {
          isSolved: false,
          hint: 'pista: aplica torque alrededor del extremo izquierdo (0 cm): m2 * 40 = (200 g de la regla * 20) + (300 g canasta * 32). Resuelve para m2, y luego usa m1 + m2 = 500 g.',
        };
      },
    },
  ];

  const currentChallenge = challenges.find((c) => c.id === activeChallengeId);
  const validationResult = currentChallenge ? currentChallenge.validate(params, weights) : { isSolved: false, hint: '' };

  return (
    <div className="flex flex-col gap-4 select-none w-full animate-fade-in">
      <div className="bg-white border border-[#e4e1db] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-none">
        <div className="flex items-center gap-3">
          <div className="p-2.2 rounded-xl bg-orange-50 text-amber-600 border border-amber-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-700 leading-snug">Manual de experimentos de física estática</h4>
            <p className="text-xs text-stone-500">Pon a prueba tu intuición resolviendo estas situaciones reales de torques.</p>
          </div>
        </div>

        {activeChallengeId && (
          <button
            onClick={onResetToSandbox}
            className="w-full sm:w-auto py-1.5 px-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            Salir del reto (modo sandbox libre)
          </button>
        )}
      </div>

      {!activeChallengeId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="p-5 bg-white hover:bg-[#faf9f5] border border-[#e4e1db] hover:border-amber-300 rounded-2xl flex flex-col gap-4 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider ${
                  c.difficulty === 'fácil' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  c.difficulty === 'medio' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {c.difficulty}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">id: {c.id}</span>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-stone-700 group-hover:text-amber-700 transition leading-snug">
                  {c.title}
                </h5>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed line-clamp-2">
                  {c.description}
                </p>
              </div>

              <button
                onClick={() => onApplyChallenge(c)}
                className="mt-2 py-2.5 px-4 bg-[#f4f2ec] hover:bg-amber-600 hover:text-white text-stone-600 border border-[#e4e1db] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Cargar escenario de reto
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Active challenge details sheet card */
        <div className="p-5 sm:p-6 bg-white border-2 border-amber-400 rounded-2xl flex flex-col gap-4 shadow-sm">
          <div className="flex items-start justify-between border-b border-[#e4e1db] pb-3 gap-2">
            <div>
              <span className="text-[9px] uppercase font-semibold tracking-wider px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                Reto activo &bull; {currentChallenge?.difficulty}
              </span>
              <h5 className="font-semibold text-stone-700 text-sm mt-1.5 leading-snug">{currentChallenge?.title}</h5>
            </div>
            <button
              onClick={() => onApplyChallenge(currentChallenge)}
              className="py-1 px-3 bg-[#f4f2ec] hover:bg-[#eadecb] text-stone-700 text-xs font-semibold rounded-lg border border-[#e4e1db] transition cursor-pointer"
            >
              Reiniciar reto
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <h6 className="text-xs font-semibold text-stone-600 uppercase tracking-widest">Instrucciones de trabajo:</h6>
            <p className="text-xs text-stone-600 leading-relaxed bg-[#fbfbfa] p-3.5 rounded-xl border border-[#eadecb]/50">
              {currentChallenge?.instructions}
            </p>

            <div className="text-xs font-medium text-amber-800 bg-amber-50 p-3.5 leading-relaxed rounded-xl border border-amber-100">
              {currentChallenge?.targetExplanation}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            validationResult.isSolved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-stone-50 border-[#e4e1db] text-stone-700'
          }`}>
            <div className="flex items-start gap-3">
              {validationResult.isSolved ? (
                <div className="p-1 px-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5 animate-bounce">
                  <Trophy className="w-5 h-5 fill-current" />
                </div>
              ) : (
                <div className="p-1 px-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                  <Lightbulb className="w-5 h-5" />
                </div>
              )}
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                  {validationResult.isSolved ? '¡Fórmula correcta!' : 'Estado de intuición'}
                </span>
                
                <p className="text-xs leading-relaxed font-sans font-medium text-stone-700">
                  {validationResult.hint}
                </p>

                {!validationResult.isSolved && (
                  <button
                    onClick={() => setShowHint(showHint === currentChallenge?.id ? null : currentChallenge?.id || '')}
                    className="text-[11px] text-amber-700 hover:text-amber-600 font-semibold inline-flex items-center gap-1 mt-1.5 select-none cursor-pointer"
                  >
                    {showHint ? 'Ocultar condiciones de equilibrio' : '¿Ayuda con los cálculos matemáticos?'}
                  </button>
                )}

                {showHint && !validationResult.isSolved && (
                  <div className="text-[11px] bg-[#FAF9F5] border border-[#e4e1db] p-4 rounded-xl text-stone-600 mt-2.5 font-mono leading-5 max-w-full">
                    {currentChallenge?.id === 'eq-basico' && (
                      <div>
                        fuerza total hacia abajo: 150 g (peso de la regla).<br />
                        por simetría pura en los apoyos laterales:<br />
                        m1 = m2 = 150 g / 2 = 75 g.<br />
                        fija ambas masas de polea a 75 g.
                      </div>
                    )}
                    {currentChallenge?.id === 'carga-asimetrica' && (
                      <div>
                        suma momentos sobre el extremo izquierdo x = 0 (T1 no ejerce torque):<br />
                        &Sigma; &tau; = m2 * 40 - 100 g * 20 - 200 g * 10 = 0<br />
                        m2 * 40 = 2000 g·cm + 2000 g·cm = 4000 g·cm<br />
                        m2 = 100 g.<br />
                        equilibrio de fuerzas verticales:<br />
                        m1 + m2 = 100 g + 200 g {"=>"} m1 = 200 g.
                      </div>
                    )}
                    {currentChallenge?.id === 'contrapeso-misterioso' && (
                      <div>
                        1. sumatoria de fuerzas verticales:<br />
                        fuerzas abajo: 120 g (regla) + 180 g (carga en 30 cm) + 50 g (nueva carga) = 350 g.<br />
                        como m1 = 150 g, debes fijar m2 = 200 g para tener equilibrio vertical.<br /><br />
                        2. sumatoria de momentos sobre x = 0:<br />
                        T2 * 40 - masa_regla * 20 - masa180 * 30 - masa50 * X_nueva = 0<br />
                        200 * 40 - 120 * 20 - 180 * 30 - 50 * X_nueva = 0<br />
                        8000 - 2400 - 5400 - 50 * X_nueva = 0<br />
                        200 = 50 * X_nueva {"=>"} X_nueva = 4 cm.<br />
                        fija m2 = 200, añade una carga de 50 g y muévela a los 4 cm.
                      </div>
                    )}
                    {currentChallenge?.id === 'puzzle-extremo' && (
                      <div>
                        suma de momentos sobre extremo izquierdo x = 0:<br />
                        &Sigma; &tau; = m2 * 40 - 200 g * 20 - 300 g * 32 = 0<br />
                        m2 * 40 = 4000 + 9600 = 13600<br />
                        m2 = 340 g.<br />
                        equilibrio de fuerzas verticales:<br />
                        m1 + m2 = 200 g + 300 g = 500 g<br />
                        m1 = 160 g.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
