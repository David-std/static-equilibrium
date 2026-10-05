export interface HangingWeight {
  id: string;
  mass: number; // grams
  x: number;    // position on ruler in cm
  color: string;
  name: string;
}

export interface PhysicsParams {
  m1: number;         // left hanger mass (g)
  m2: number;         // right hanger mass (g)
  rulerMass: number;  // ruler mass (g)
  rulerLength: number; // ruler length (cm)
  gravity: number;    // m/s²
  pivot: number;      // torque pivot point (cm)
}

export interface LabChallenge {
  id: string;
  title: string;
  instruction: string;
  setup: {
    rulerMass: number;
    rulerLength?: number;
    m1?: number;
    m2?: number;
    weights: Omit<HangingWeight, 'id' | 'color' | 'name'>[];
    targetPivot?: number;
  };
  validation: (params: PhysicsParams, weights: HangingWeight[]) => {
    isSolved: boolean;
    feedback: string;
  };
}
