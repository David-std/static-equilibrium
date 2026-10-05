import { HangingWeight, PhysicsParams } from '../types';

export interface EquilibriumStatus {
  t1Val: number;
  t2Val: number;
  rulerWVal: number;
  totalDownWVal: number;
  fNetY: number;
  torqueNet: number;
  isFBalanced: boolean;
  isTorqueBalanced: boolean;
}

const getWeightWidthCm = (mass: number, rulerLength: number): number => {
  const px = Math.max(24, Math.min(54, 24 + 28 * (mass / 500)));
  return px * (rulerLength / 540);
};

export const getMinWeightDistance = (massA: number, massB: number, rulerLength: number): number => {
  return (getWeightWidthCm(massA, rulerLength) + getWeightWidthCm(massB, rulerLength)) / 2 + 0.1;
};

export const resolveWeightOverlapList = (
  list: HangingWeight[],
  draggedId: string | null,
  L: number
): HangingWeight[] => {
  if (list.length === 0) return list;

  let arr = list.map(w => ({ ...w }));
  arr.sort((a, b) => a.x - b.x);

  const dragIdx = arr.findIndex(w => w.id === draggedId);

  if (dragIdx !== -1) {
    for (let i = dragIdx - 1; i >= 0; i--) {
      const d = getMinWeightDistance(arr[i].mass, arr[i + 1].mass, L);
      if (arr[i].x > arr[i + 1].x - d) arr[i].x = arr[i + 1].x - d;
    }
    for (let i = dragIdx + 1; i < arr.length; i++) {
      const d = getMinWeightDistance(arr[i - 1].mass, arr[i].mass, L);
      if (arr[i].x < arr[i - 1].x + d) arr[i].x = arr[i - 1].x + d;
    }
  } else {
    for (let i = 1; i < arr.length; i++) {
      const d = getMinWeightDistance(arr[i - 1].mass, arr[i].mass, L);
      if (arr[i].x < arr[i - 1].x + d) arr[i].x = arr[i - 1].x + d;
    }
  }

  if (arr[0].x < 0) {
    arr[0].x = 0;
    for (let i = 1; i < arr.length; i++) {
      const d = getMinWeightDistance(arr[i - 1].mass, arr[i].mass, L);
      if (arr[i].x < arr[i - 1].x + d) arr[i].x = arr[i - 1].x + d;
    }
  }

  const last = arr.length - 1;
  if (arr[last].x > L) {
    arr[last].x = L;
    for (let i = last - 1; i >= 0; i--) {
      const d = getMinWeightDistance(arr[i].mass, arr[i + 1].mass, L);
      if (arr[i].x > arr[i + 1].x - d) arr[i].x = arr[i + 1].x - d;
    }
  }

  return arr.map(w => ({ ...w, x: Math.min(L, Math.max(0, Math.round(w.x * 10) / 10)) }));
};

export const calcEquilibrium = (params: PhysicsParams, weights: HangingWeight[]): EquilibriumStatus => {
  const g = params.gravity;
  const t1Val = (params.m1 / 1000) * g;
  const t2Val = (params.m2 / 1000) * g;
  const rulerWVal = (params.rulerMass / 1000) * g;
  const totalDownWVal = rulerWVal + weights.reduce((s, w) => s + (w.mass / 1000) * g, 0);

  const fNetY = t1Val + t2Val - totalDownWVal;
  const isFBalanced = Math.abs(fNetY) < 0.015;

  const L = params.rulerLength;
  const pivot = params.pivot;
  const cg = L / 2;
  const torqueNet =
    t1Val * ((0 - pivot) / 100) +
    t2Val * ((L - pivot) / 100) -
    rulerWVal * ((cg - pivot) / 100) -
    weights.reduce(
      (sum, weight) => sum + (weight.mass / 1000) * g * ((weight.x - pivot) / 100),
      0,
    );
  const isTorqueBalanced = Math.abs(torqueNet) < 0.0015;

  return { t1Val, t2Val, rulerWVal, totalDownWVal, fNetY, torqueNet, isFBalanced, isTorqueBalanced };
};

export const solveM2 = (params: PhysicsParams, weights: HangingWeight[]): number => {
  const L = params.rulerLength;
  const sum = params.rulerMass * (L / 2) + weights.reduce((s, w) => s + w.mass * w.x, 0);
  return Math.max(50, Math.round((sum / L) * 10) / 10);
};

export const solveM1 = (params: PhysicsParams, weights: HangingWeight[]): number => {
  const L = params.rulerLength;
  const sum = params.rulerMass * (L / 2) + weights.reduce((s, w) => s + w.mass * (L - w.x), 0);
  return Math.max(50, Math.round((sum / L) * 10) / 10);
};

export const solveAll = (params: PhysicsParams, weights: HangingWeight[]): { m1: number; m2: number } => {
  const m2 = solveM2(params, weights);
  const total = params.rulerMass + weights.reduce((s, w) => s + w.mass, 0);
  return { m1: Math.max(50, Math.round((total - m2) * 10) / 10), m2 };
};
