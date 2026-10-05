export const renderSubscriptSVG = (text: string) => {
  const parts = text.split('_');

  if (parts.length > 1) {
    const base = parts[0];
    const restMatch = parts[1].match(/^([a-zA-Z0-9]+)(.*)$/);

    if (restMatch) {
      const sub = restMatch[1];
      const rest = restMatch[2];

      return (
        <>
          <tspan fontStyle="italic" fontWeight="bold">{base}</tspan>
          <tspan dy="2" fontSize="6">{sub}</tspan>
          <tspan dy="-2" fontSize="8.5">{rest}</tspan>
        </>
      );
    }
  }

  const legacyMatch = text.match(/^([TWNm])([12ABregla]+)(.*)$/);

  if (legacyMatch) {
    const base = legacyMatch[1];
    const sub = legacyMatch[2];
    const rest = legacyMatch[3];

    return (
      <>
        <tspan fontStyle="italic" fontWeight="bold">{base}</tspan>
        <tspan dy="2" fontSize="6">{sub}</tspan>
        <tspan dy="-2" fontSize="8.5">{rest}</tspan>
      </>
    );
  }

  return <tspan>{text}</tspan>;
};

export const getDiscsForMass = (totalMass: number): number[] => {
  const denominations = [250, 100, 50];
  const discs: number[] = [];
  let remaining = totalMass;

  for (const denomination of denominations) {
    while (remaining >= denomination) {
      discs.push(denomination);
      remaining = Number((remaining - denomination).toFixed(1));
    }
  }

  if (remaining > 0.05) discs.push(remaining);

  return discs;
};

export const getDiskDimensions = (diskMass: number) => {
  if (diskMass >= 250) return { width: 56, height: 13 };
  if (diskMass === 100) return { width: 44, height: 10 };
  if (diskMass === 50) return { width: 38, height: 8 };

  const norm = Math.max(0, Math.min(1, diskMass / 50));
  return {
    width: Math.round(22 + 16 * norm),
    height: Math.round(4.5 + 3.5 * norm),
  };
};

export const getDiscsHeightInfo = (mass: number) => {
  const discs = getDiscsForMass(mass);
  const totalStackHeight = discs.reduce(
    (height, disc) => height + getDiskDimensions(disc).height + 1,
    0,
  );
  const shaftHeight = Math.max(45, totalStackHeight + 15);
  const topCoordY = -24;
  const bottomCoordY = topCoordY + shaftHeight;
  const centerDisksY = bottomCoordY - 2 - totalStackHeight / 2;

  return { centerDisksY, shaftHeight };
};

export const getHangerShaftHeight = (mass: number) =>
  getDiscsHeightInfo(mass).shaftHeight;
