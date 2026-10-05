import { useEffect, useState } from 'react';
import type { HangingWeight } from '../../types';
import { formatDec } from '../../utils/format';

interface WeightCoordinateInputProps {
  weightId: string;
  xValue: number;
  rulerLength: number;
  unitSystem: 'cgs' | 'si';
  onChange: (id: string, updates: Partial<HangingWeight>) => void;
}

export function WeightCoordinateInput({
  weightId,
  xValue,
  rulerLength,
  unitSystem,
  onChange,
}: WeightCoordinateInputProps) {
  const toDisplay = (cm: number) =>
    unitSystem === 'si' ? formatDec(cm / 100, 2) : formatDec(cm, 1);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setValue(toDisplay(xValue));
  }, [xValue, unitSystem, focused]);

  const commit = (text: string) => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isNaN(parsed)) return;

    const cm = unitSystem === 'si' ? parsed * 100 : parsed;
    onChange(weightId, { x: Math.max(0, Math.min(rulerLength, cm)) });
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        commit(event.target.value);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className="w-16 bg-stone-50 border border-stone-300 rounded text-right px-1 py-0.5 font-mono text-[11px] text-stone-800 font-black focus:outline-none focus:border-red-700"
    />
  );
}

interface WeightMassInputProps {
  weightId: string;
  massValue: number;
  unitSystem: 'cgs' | 'si';
  onChange: (id: string, updates: Partial<HangingWeight>) => void;
}

export function WeightMassInput({
  weightId,
  massValue,
  unitSystem,
  onChange,
}: WeightMassInputProps) {
  const toDisplay = (grams: number) =>
    unitSystem === 'si' ? formatDec(grams / 1000, 3) : formatDec(grams, 1);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setValue(toDisplay(massValue));
  }, [massValue, unitSystem, focused]);

  const commit = (text: string) => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isNaN(parsed)) return;

    const grams = unitSystem === 'si' ? parsed * 1000 : parsed;
    onChange(weightId, { mass: Math.max(10, Math.min(500, grams)) });
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        commit(event.target.value);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className="w-16 bg-stone-50 border border-stone-300 rounded text-right px-1 py-0.5 font-mono text-[11px] text-[#292524] font-black focus:outline-none focus:border-red-600"
    />
  );
}

interface ParamDecimalInputProps {
  value: number;
  min: number;
  max: number;
  unitSystem: 'cgs' | 'si';
  isMassKg?: boolean;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function ParamDecimalInput({
  value,
  min,
  max,
  unitSystem,
  isMassKg = false,
  onChange,
  className = '',
  disabled = false,
}: ParamDecimalInputProps) {
  const toDisplay = (currentValue: number) =>
    unitSystem === 'si' && isMassKg
      ? formatDec(currentValue / 1000, 3)
      : formatDec(currentValue, 1);

  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setInputValue(toDisplay(value));
  }, [value, unitSystem, focused]);

  const commit = (text: string) => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (Number.isNaN(parsed)) return;

    const factor = unitSystem === 'si' && isMassKg ? 1000 : 1;
    onChange(Math.max(min, Math.min(max, parsed * factor)));
  };

  return (
    <input
      type="text"
      value={inputValue}
      disabled={disabled}
      onChange={(event) => {
        setInputValue(event.target.value);
        commit(event.target.value);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(inputValue);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      className={className}
    />
  );
}
