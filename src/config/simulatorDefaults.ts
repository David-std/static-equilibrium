import type { HangingWeight, PhysicsParams } from '../types';

export const DEFAULT_PARAMS: PhysicsParams = {
  m1: 150,
  m2: 150,
  rulerMass: 200,
  rulerLength: 40,
  gravity: 9.81,
  pivot: 20,
};

export const DEFAULT_WEIGHTS: HangingWeight[] = [
  { id: 'preset-c-1', mass: 100, x: 20, color: '#f59e0b', name: 'A' },
];

export const WEIGHT_COLORS = [
  '#f59e0b',
  '#dc2626',
  '#2563eb',
  '#059669',
  '#8b5cf6',
  '#4b5563',
];
