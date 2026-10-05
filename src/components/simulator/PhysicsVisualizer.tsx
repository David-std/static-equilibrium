/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { HangingWeight, PhysicsParams } from '../../types';
import { ArrowBigUp, ArrowBigDown, ToggleLeft, ToggleRight, Lock } from 'lucide-react';
import { formatDec, formatGrams } from '../../utils/format';
import { getDiscsForMass, getDiskDimensions, getDiscsHeightInfo, getHangerShaftHeight, renderSubscriptSVG } from './visualizerUtils';

interface PhysicsVisualizerProps {
  params: PhysicsParams;
  weights: HangingWeight[];
  onUpdateWeightPos: (id: string, x: number) => void;
  onRemoveWeight: (id: string) => void;
  showDCL: boolean;
  hiddenDclBodies: string[];
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
  showRotationSenses?: boolean;
}


const enableThemeSwitch = true;

export const PhysicsVisualizer: React.FC<PhysicsVisualizerProps> = ({
  params,
  weights,
  onUpdateWeightPos,
  onRemoveWeight,
  showDCL,
  hiddenDclBodies,
  unitSystem,
  equilibriumStatus,
  showRotationSenses = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredWeightId, setHoveredWeightId] = useState<string | null>(null);
  const [viewStyle, setViewStyle] = useState<'realistic' | 'word'>('realistic');

  const [draggedLabelId, setDraggedLabelId] = useState<string | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartOffset, setDragStartOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [dclLabelOffsets, setDclLabelOffsets] = useState<Record<string, { dx: number; dy: number }>>({});

  const { m1, m2, rulerMass, rulerLength, gravity } = params;

  const Y_NOMINAL = 240;
  const X_LEFT_RULER = 180;
  const X_RIGHT_RULER = 720;
  const RULER_WIDTH = X_RIGHT_RULER - X_LEFT_RULER;

  const g = gravity;
  const rulerWPlates = (rulerMass / 1000) * g;
  const t1 = (m1 / 1000) * g;
  const t2 = (m2 / 1000) * g;

  const SCALE_FORCE_TO_PX = 32;
  const MAX_UPWARD_DISPLACEMENT = 55;
  const MAX_DOWNWARD_DISPLACEMENT = 170;

  const shaftHeight1 = getHangerShaftHeight(m1);
  const shaftHeight2 = getHangerShaftHeight(m2);

  const maxDispLimitA = 134 - shaftHeight1;
  const maxDispLimitB = 134 - shaftHeight2;

  const customWeightsSumA_num = weights.reduce(
    (sum, w) => sum + (w.mass / 1000) * g * (rulerLength - w.x),
    0
  );
  const fANet_final = t1 - (rulerWPlates * 0.5 + customWeightsSumA_num / rulerLength);

  const customWeightsSumB_num = weights.reduce(
    (sum, w) => sum + (w.mass / 1000) * g * w.x,
    0
  );
  const fBNet_final = t2 - (rulerWPlates * 0.5 + customWeightsSumB_num / rulerLength);

  const dispA = Math.max(-MAX_DOWNWARD_DISPLACEMENT, Math.min(maxDispLimitA, fANet_final * SCALE_FORCE_TO_PX));
  const dispB = Math.max(-MAX_DOWNWARD_DISPLACEMENT, Math.min(maxDispLimitB, fBNet_final * SCALE_FORCE_TO_PX));

  const yA = Y_NOMINAL - dispA;
  const yB = Y_NOMINAL - dispB;
  const centerYA = (yA + yB) / 2;
  const angleRad = Math.atan2(yB - yA, RULER_WIDTH);
  const angleDeg = angleRad * (180 / Math.PI);
  const centerX = 450;

  const getWeightWorldCoords = (x_cm: number, localY: number = 0) => {
    const fraction = x_cm / rulerLength;
    const localX = -RULER_WIDTH / 2 + fraction * RULER_WIDTH;
    const cosVal = Math.cos(angleRad);
    const sinVal = Math.sin(angleRad);
    const worldX = centerX + localX * cosVal - localY * sinVal;
    const worldY = centerYA + localX * sinVal + localY * cosVal;
    return { x: worldX, y: worldY };
  };

  const localForcesMap: { [id: string]: number } = {};
  weights.forEach(w => {
    const worldCoords = getWeightWorldCoords(w.x);
    const wHeight = Math.max(16, Math.min(42, 16 + 24 * (w.mass / 500)));
    const nominalWeightY = worldCoords.y + 42;
    const maxAllowedWeightY = 453 - wHeight - 5;

    const isSlack = nominalWeightY > maxAllowedWeightY;
    localForcesMap[w.id] = isSlack ? 0 : (w.mass / 1000) * g;
  });

  const getSvgCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 900;
    const y = ((clientY - rect.top) / rect.height) * 510;
    return { x, y };
  };

  const handleMouseDown = (id: string) => {
    setDraggedId(id);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (draggedId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const svgWidth = rect.width;
      const scaleFactor = 900 / svgWidth;
      const svgMouseX = mouseX * scaleFactor;

      const fraction = (svgMouseX - X_LEFT_RULER) / RULER_WIDTH;
      const cm = Math.max(0, Math.min(rulerLength, Math.round(fraction * rulerLength)));
      onUpdateWeightPos(draggedId, cm);
    } else if (draggedLabelId && svgRef.current) {
      e.preventDefault();
      const coords = getSvgCoords(e.clientX, e.clientY);
      const deltaX = coords.x - dragStartMouse.x;
      const deltaY = coords.y - dragStartMouse.y;

      setDclLabelOffsets(prev => ({
        ...prev,
        [draggedLabelId]: {
          dx: dragStartOffset.dx + deltaX,
          dy: dragStartOffset.dy + deltaY
        }
      }));
    }
  };

  const handleMouseUpOrLeave = () => {
    setDraggedId(null);
    setDraggedLabelId(null);
  };

  const yHanger1 = 345 + dispA;
  const yHanger2 = 345 + dispB;

  const renderStackedDisks = (mass: number, cX: number, baseY: number, hangerColor: string) => {
    const discsVal = getDiscsForMass(mass);
    const elements: React.JSX.Element[] = [];

    let totalStackHeight = 0;
    discsVal.forEach(d => {
      totalStackHeight += getDiskDimensions(d).height + 1;
    });
    const shaftHeight = Math.max(45, totalStackHeight + 15);
    const topCoordY = baseY - 24;
    const bottomCoordY = topCoordY + shaftHeight;

    const isWord = viewStyle === 'word';

    elements.push(
      <g key="hanger-shaft" opacity={isWord ? 1 : 0.9}>
        <path d={`M ${cX} ${topCoordY - 8} Q ${cX - 4} ${topCoordY - 4} ${cX} ${topCoordY}`} stroke={isWord ? "#595959" : "#334155"} strokeWidth={isWord ? "1.5" : "2.2"} fill="none" />
        <circle cx={cX} cy={topCoordY - 8} r="3" fill="none" stroke={isWord ? "#595959" : "#334155"} strokeWidth={isWord ? "1.5" : "1.8"} />
        <line x1={cX} y1={topCoordY} x2={cX} y2={bottomCoordY} stroke={isWord ? "#595959" : "#475569"} strokeWidth={isWord ? "1.5" : "2.5"} />
        <line x1={cX - 12} y1={bottomCoordY} x2={cX + 12} y2={bottomCoordY} stroke={isWord ? "#595959" : "#1e293b"} strokeWidth={isWord ? "2.5" : "3.5"} strokeLinecap="round" />
      </g>
    );

    let currentY = bottomCoordY - 2;
    discsVal.reverse().forEach((diskMass, idx) => {
      const { width, height } = getDiskDimensions(diskMass);
      const rectX = cX - width / 2;
      const rectY = currentY - height;

      const wordFill = cX < 450 ? '#5b9bd5' : '#ed7d31';
      const wordStroke = cX < 450 ? '#41719c' : '#c65911';

      elements.push(
        <g key={`disk-elem-${idx}`} opacity={isWord ? 1 : 0.95} filter={isWord ? undefined : "drop-shadow(0px 1px 1.5px rgba(0,0,0,0.12))"}>
          <rect
            x={rectX}
            y={rectY}
            width={width}
            height={height}
            rx={isWord ? 0 : 1.5}
            fill={isWord ? wordFill : hangerColor}
            stroke={isWord ? wordStroke : "#0f172a"}
            strokeWidth={isWord ? "1.2" : "0.8"}
          />
          {!isWord && (
            <>
              <line x1={cX} y1={rectY} x2={cX} y2={rectY + height} stroke="#040711" strokeWidth="0.8" opacity="0.45" />
              <line x1={cX - width / 2} y1={rectY + height / 2} x2={cX - width / 4} y2={rectY + height / 2} stroke="#ffffff" strokeWidth="0.8" opacity="0.25" />
            </>
          )}

          {width >= 24 && height >= 5.5 && (
            <text
              x={cX}
              y={rectY + height / 2 + 2.5}
              fontSize={isWord ? "7.5" : "6.5"}
              fontFamily={isWord ? "Calibri, Arial, sans-serif" : "monospace"}
              fontWeight={isWord ? "bold" : "black"}
              fill="#ffffff"
              textAnchor="middle"
              opacity="0.95"
            >
              {unitSystem === 'si' ? `${formatDec(diskMass / 1000, 2)} kg` : `${formatGrams(diskMass)} g`}
            </text>
          )}
        </g>
      );
      currentY -= (height + 1);
    });

    const isLeft = cX < 450;
    const cardWidth = 84;
    const cardHeight = 14;
    const cardX = isLeft ? cX - 116 : cX + 32;
    const cardY = baseY - cardHeight / 2;

    elements.push(
      <g key="total-weight-card" className="pointer-events-none">
        <line
          x1={isLeft ? cardX + cardWidth : cardX}
          y1={baseY}
          x2={cX}
          y2={baseY}
          stroke={isWord ? "#a5a5a5" : "#e1decb"}
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.9"
        />
        <rect
          x={cardX}
          y={cardY}
          width={cardWidth}
          height={cardHeight}
          rx={isWord ? 0 : "3.5"}
          fill={isWord ? "#ffffff" : "#faf8f5"}
          stroke={isWord ? "#7f7f7f" : "#e1decb"}
          strokeWidth="0.8"
          filter={isWord ? undefined : "drop-shadow(0px 1.5px 2px rgba(0,0,0,0.08))"}
        />
        <text
          x={cardX + cardWidth / 2}
          y={cardY + cardHeight / 2 + 3}
          fontSize="9"
          fontWeight="bold"
          fontFamily={isWord ? "Calibri, Arial, sans-serif" : "sans-serif"}
          fill={isWord ? "#333333" : "#44403c"}
          textAnchor="middle"
        >
          Total: {unitSystem === 'si' ? `${formatDec(mass / 1000, 3)} kg` : `${formatGrams(mass)} g`}
        </text>
      </g>
    );

    return elements;
  };

  const getVectorArrow = (
    startX: number,
    startY: number,
    forceN: number,
    direction: 'up' | 'down',
    color: string,
    label: string,
    badgeOffsetX?: number,
    alignSide: 'left' | 'right' = 'right',
    labelId?: string
  ) => {
    const pxLen = 18 + Math.min(30, forceN * 2.5);
    const endY = direction === 'up' ? startY - pxLen : startY + pxLen;
    const arrowSign = direction === 'up' ? -1 : 1;

    const badgeWidth = Math.max(50, label.length * 5.8 + 12);
    const badgeHeight = 15;
    const defaultOffset = alignSide === 'left' ? -badgeWidth - 6 : 6;
    const badgeX = startX + (badgeOffsetX !== undefined ? badgeOffsetX : defaultOffset);

    const offset = labelId ? dclLabelOffsets[labelId] : null;
    const dx = offset ? offset.dx : 0;
    const dy = offset ? offset.dy : 0;

    const finalBadgeX = badgeX + dx;
    const finalBadgeY = (direction === 'up' ? endY + 2 : endY - 17) + dy;
    const finalTextX = finalBadgeX + badgeWidth / 2;
    const finalTextY = finalBadgeY + 10.5;

    const isWord = viewStyle === 'word';

    let shapeColor = color;
    if (isWord) {
      if (color === '#2563eb' || color === '#3b82f6' || color === '#1d4ed8') {
        shapeColor = '#2f5597';
      } else if (color === '#059669' || color === '#10b981' || color === '#6366f1' || color === '#0d9488') {
        shapeColor = '#70ad47';
      } else if (color === '#ef4444' || color === '#dc2626' || color === '#be123c' || color === '#e11d48' || color === '#db2777') {
        shapeColor = '#c00000';
      } else if (color === '#d97706' || color === '#f97316' || color === '#8b5cf6') {
        shapeColor = '#ed7d31';
      } else if (color === '#7c2d12' || color === '#78350f') {
        shapeColor = '#833c0c';
      } else {
        shapeColor = '#595959';
      }
    }

    const hasOffset = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;

    const isCurrentlyDragged = labelId === draggedLabelId;
    const cursorStyle = labelId ? (isCurrentlyDragged ? 'grabbing' : 'grab') : 'default';

    const renderDottedLine = hasOffset && (
      <line
        x1={startX}
        y1={endY}
        x2={finalBadgeX + badgeWidth / 2}
        y2={finalBadgeY + badgeHeight / 2}
        stroke={shapeColor}
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.8"
        className="pointer-events-none"
      />
    );

    const badgeInteractiveProps = labelId ? {
      onMouseDown: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const coords = getSvgCoords(e.clientX, e.clientY);
        setDraggedLabelId(labelId);
        setDragStartMouse(coords);
        const currentOffset = dclLabelOffsets[labelId] || { dx: 0, dy: 0 };
        setDragStartOffset(currentOffset);
      },
      onDoubleClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setDclLabelOffsets(prev => {
          const next = { ...prev };
          delete next[labelId];
          return next;
        });
      },
      style: { cursor: cursorStyle },
      className: "pointer-events-auto select-none"
    } : {
      className: "pointer-events-none select-none"
    };

    if (isWord) {
      return (
        <g className="transition-all duration-150">
          {renderDottedLine}
          <line
            x1={startX}
            y1={startY}
            x2={startX}
            y2={endY}
            stroke={shapeColor}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="pointer-events-none"
          />
          <polygon
            points={`${startX},${endY} ${startX - 5},${endY - 8 * arrowSign} ${startX + 5},${endY - 8 * arrowSign}`}
            fill={shapeColor}
            className="pointer-events-none"
          />
          <g {...badgeInteractiveProps}>
            <rect
              x={finalBadgeX}
              y={finalBadgeY}
              width={badgeWidth}
              height={badgeHeight}
              rx={0}
              fill="#ffffff"
              stroke={shapeColor}
              strokeWidth="0.8"
              opacity="0.95"
            />
            <text
              x={finalTextX}
              y={finalTextY}
              fontSize="8.5"
              fontFamily="Calibri, Arial, sans-serif"
              fontWeight="bold"
              fill="#333333"
              textAnchor="middle"
            >
              {renderSubscriptSVG(label)}
            </text>
          </g>
        </g>
      );
    }

    return (
      <g className="transition-all duration-300" opacity="0.95" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.15))">
        {renderDottedLine}
        <line x1={startX} y1={startY} x2={startX} y2={endY} stroke={color} strokeWidth="4.5" strokeLinecap="round" opacity="0.85" className="pointer-events-none" />
        <line x1={startX} y1={startY} x2={startX} y2={endY} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" className="pointer-events-none" />
        
        <polygon
          points={`${startX},${endY} ${startX - 6.5},${endY - 9.5 * arrowSign} ${startX + 6.5},${endY - 9.5 * arrowSign}`}
          fill={color}
          className="pointer-events-none"
        />
        
        <g {...badgeInteractiveProps}>
          <rect
            x={finalBadgeX}
            y={finalBadgeY}
            width={badgeWidth}
            height={badgeHeight}
            rx="3"
            fill="#1c1917"
            stroke="#44403c"
            strokeWidth="0.5"
            opacity="0.95"
          />
          <text
            x={finalTextX}
            y={finalTextY}
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#fafaf9"
            textAnchor="middle"
          >
            {renderSubscriptSVG(label)}
          </text>
        </g>
      </g>
    );
  };

  const isSystemTotallyBalanced = equilibriumStatus.isFBalanced && equilibriumStatus.isTorqueBalanced;
  const allBodies = ['ruler', 't1', 't2', ...weights.map(w => w.id)];
  const isAnyDclActive = showDCL && allBodies.some(id => !hiddenDclBodies.includes(id));

  return (
    <div className="flex flex-col w-full bg-[#fbfbf9] border border-[#e5e4df] rounded-2xl shadow-md overflow-hidden font-sans">
      
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#f4f2ec] border-b border-[#e5e4df]">
        <div className="flex items-center gap-2.5">
          <div className={`w-3.5 h-3.5 rounded-full border-2 ${
            isSystemTotallyBalanced 
              ? 'bg-emerald-500 border-emerald-200 animate-pulse' 
              : 'bg-amber-400 border-amber-200'
          }`} />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4d483e]">
              Aparato suspendido: {isSystemTotallyBalanced ? 'Estabilidad absoluta' : 'Estado no equilibrado'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-[#eadecb] text-[#6d5e49] font-mono px-2 py-0.5 rounded font-bold uppercase">
            Laboratorio estático
          </span>
          <span className="text-xs text-[#78716c] hidden md:inline">
            Física clásica de rotación y traslación
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-[90/51] p-1 bg-[#fcfbf7] select-none border-b border-[#e5e4df]">
        
        <svg
          ref={svgRef}
          viewBox="0 0 900 510"
          className="w-full h-full cursor-default"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          id="physics-canvas"
        >
          <defs>
            <linearGradient id="wood-desk" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cca06c" />
              <stop offset="15%" stopColor="#b0814c" />
              <stop offset="100%" stopColor="#825a30" />
            </linearGradient>
            
            <linearGradient id="brass-pulley" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdf4ce" />
              <stop offset="50%" stopColor="#cca43b" />
              <stop offset="100%" stopColor="#8a681c" />
            </linearGradient>

            <linearGradient id="iron-rod" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b4b8c2" />
              <stop offset="40%" stopColor="#e2e5ec" />
              <stop offset="70%" stopColor="#cbd2db" />
              <stop offset="100%" stopColor="#949da6" />
            </linearGradient>

            <linearGradient id="ruler-wood-texture" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8d6a3" />
              <stop offset="40%" stopColor="#f2c07e" />
              <stop offset="100%" stopColor="#d59c50" />
            </linearGradient>

            <filter id="shadow-clean" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
            </filter>
            
            <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e8e7e1" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1" fill="#cca77e" opacity="0.3" />
            </pattern>
          </defs>

          {viewStyle === 'word' ? (
            <rect width="900" height="455" fill="#ffffff" stroke="#bfbfbf" strokeWidth="1" />
          ) : (
            <rect width="900" height="455" fill="url(#graph-grid)" />
          )}

          {viewStyle !== 'word' && (
            <>
              <line x1={X_LEFT_RULER} y1="110" x2={X_LEFT_RULER} y2="360" stroke="#78716c" strokeWidth="1" strokeDasharray="3,5" opacity="0.15" />
              <line x1={X_RIGHT_RULER} y1="110" x2={X_RIGHT_RULER} y2="360" stroke="#78716c" strokeWidth="1" strokeDasharray="3,5" opacity="0.15" />
            </>
          )}

          {viewStyle === 'word' ? (
            <>
              <rect x="40" y="455" width="820" height="15" fill="#f2f2f2" stroke="#595959" strokeWidth="1.5" />
              <rect x="105" y="445" width="110" height="11" fill="#7f7f7f" stroke="#595959" strokeWidth="1.2" />
              <rect x="685" y="445" width="110" height="11" fill="#7f7f7f" stroke="#595959" strokeWidth="1.2" />
              <rect x="154" y="80" width="12" height="366" fill="#bfbfbf" stroke="#595959" strokeWidth="1.2" />
              <rect x="734" y="80" width="12" height="366" fill="#bfbfbf" stroke="#595959" strokeWidth="1.2" />
              <rect x="120" y="45" width="660" height="10" fill="#bfbfbf" stroke="#595959" strokeWidth="1.2" />
            </>
          ) : (
            <>
              <rect x="40" y="455" width="820" height="25" rx="4" fill="url(#wood-desk)" filter="url(#shadow-clean)" />
              <rect x="40" y="455" width="820" height="3" fill="#ffedd5" opacity="0.25" />
              <rect x="105" y="445" width="110" height="11" rx="2" fill="#57534e" stroke="#2c2a29" strokeWidth="1" />
              <rect x="685" y="445" width="110" height="11" rx="2" fill="#57534e" stroke="#2c2a29" strokeWidth="1" />
              <rect x="152" y="80" width="16" height="366" fill="url(#iron-rod)" stroke="#57534e" strokeWidth="0.8" />
              <rect x="732" y="80" width="16" height="366" fill="url(#iron-rod)" stroke="#57534e" strokeWidth="0.8" />
              <rect x="120" y="45" width="660" height="12" fill="url(#iron-rod)" stroke="#44403c" strokeWidth="0.8" />
            </>
          )}

          <g
            stroke={viewStyle === 'word' ? '#595959' : '#991b1b'}
            strokeWidth={viewStyle === 'word' ? 1.5 : 1.8}
            fill="none"
            opacity="0.9"
            filter={viewStyle === 'word' ? undefined : "drop-shadow(0px 1.5px 1px rgba(0,0,0,0.15))"}
          >
            <line x1="140" y1={yHanger1 - 32} x2="140" y2="78" />
            <path d="M 140 78 A 20 20 0 0 1 180 78" />
            <line x1="180" y1="78" x2={X_LEFT_RULER} y2={yA} />

            <line x1="720" y1={yB} x2="720" y2="78" />
            <path d="M 720 78 A 20 20 0 0 1 760 78" />
            <line x1="760" y1="78" x2="760" y2={yHanger2 - 32} />
          </g>

          {viewStyle === 'word' ? (
            <g transform="translate(160, 80)">
              <line x1="0" y1="-28" x2="0" y2="0" stroke="#595959" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#595959" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="13" fill="#f2f2f2" stroke="#595959" strokeWidth="1" />
              <circle cx="0" cy="0" r="4" fill="#bfbfbf" stroke="#595959" strokeWidth="1" />
            </g>
          ) : (
            <g filter="url(#shadow-clean)" transform="translate(160, 80)">
              <path d="M 0 -28 L 0 0" stroke="#78716c" strokeWidth="2.5" fill="none" />
              <circle cx="0" cy="0" r="23" fill="#ffffff" stroke="#78716c" strokeWidth="1.5" />
              {Array.from({ length: 12 }).map((_, idx) => (
                <line
                  key={`l-tick-${idx}`}
                  x1="0"
                  y1="-23"
                  x2="0"
                  y2="-19"
                  stroke="#a8a29e"
                  strokeWidth="1.2"
                  transform={`rotate(${idx * 30})`}
                />
              ))}
              <circle cx="0" cy="0" r="16" fill="url(#brass-pulley)" stroke="#44403c" strokeWidth="1.2" />
              {Array.from({ length: 4 }).map((_, idx) => (
                <line
                  key={`l-spoke-${idx}`}
                  x1="0"
                  y1="0"
                  x2="15"
                  y2="0"
                  stroke="#1e293b"
                  strokeWidth="2"
                  opacity="0.3"
                  transform={`rotate(${idx * 90 + (dispA * 2.5)})`}
                />
              ))}
              <circle cx="0" cy="0" r="5" fill="#f5f5f4" stroke="#44403c" strokeWidth="1.5" />
            </g>
          )}

          {viewStyle === 'word' ? (
            <g transform="translate(740, 80)">
              <line x1="0" y1="-28" x2="0" y2="0" stroke="#595959" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#595959" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="13" fill="#f2f2f2" stroke="#595959" strokeWidth="1" />
              <circle cx="0" cy="0" r="4" fill="#bfbfbf" stroke="#595959" strokeWidth="1" />
            </g>
          ) : (
            <g filter="url(#shadow-clean)" transform="translate(740, 80)">
              <path d="M 0 -28 L 0 0" stroke="#78716c" strokeWidth="2.5" fill="none" />
              <circle cx="0" cy="0" r="23" fill="#ffffff" stroke="#78716c" strokeWidth="1.5" />
              {Array.from({ length: 12 }).map((_, idx) => (
                <line
                  key={`r-tick-${idx}`}
                  x1="0"
                  y1="-23"
                  x2="0"
                  y2="-19"
                  stroke="#a8a29e"
                  strokeWidth="1.2"
                  transform={`rotate(${idx * 30})`}
                />
              ))}
              <circle cx="0" cy="0" r="16" fill="url(#brass-pulley)" stroke="#44403c" strokeWidth="1.2" />
              {Array.from({ length: 4 }).map((_, idx) => (
                <line
                  key={`r-spoke-${idx}`}
                  x1="0"
                  y1="0"
                  x2="15"
                  y2="0"
                  stroke="#1e293b"
                  strokeWidth="2"
                  opacity="0.3"
                  transform={`rotate(${idx * 90 - (dispB * 2.5)})`}
                />
              ))}
              <circle cx="0" cy="0" r="5" fill="#f5f5f4" stroke="#44403c" strokeWidth="1.5" />
            </g>
          )}

          <g id="left-slotted-disks" filter={viewStyle === 'word' ? undefined : "url(#shadow-clean)"}>
            {renderStackedDisks(m1, 140, yHanger1, '#da4a4a')}
          </g>

          <g id="right-slotted-disks" filter={viewStyle === 'word' ? undefined : "url(#shadow-clean)"}>
            {renderStackedDisks(m2, 760, yHanger2, '#da4a4a')}
          </g>

          <g
            transform={`translate(450, ${centerYA}) rotate(${angleDeg})`}
            filter={viewStyle === 'word' ? undefined : "url(#shadow-clean)"}
            id="ruler-group"
          >
            <rect
              x="-270"
              y="-11"
              width="540"
              height="22"
              rx={viewStyle === 'word' ? 0 : 2.5}
              fill={viewStyle === 'word' ? '#f2f2f2' : "url(#ruler-wood-texture)"}
              stroke={viewStyle === 'word' ? '#595959' : "#543c1b"}
              strokeWidth={viewStyle === 'word' ? 1.5 : 2.2}
            />
            <line x1="-265" y1="0" x2="265" y2="0" stroke={viewStyle === 'word' ? '#a6a6a6' : '#7e542b'} strokeWidth="0.8" strokeDasharray="3,3" />

            {(() => {
              const stepCm = rulerLength <= 50 ? 1 : (rulerLength <= 80 ? 2 : 5);
              const elements: React.JSX.Element[] = [];

              for (let cm = 0; cm <= rulerLength; cm += stepCm) {
                const fraction = cm / rulerLength;
                const tickX = -270 + fraction * 540;
                
                const isMajor = cm % (stepCm * 5 === 0 ? stepCm * 5 : (rulerLength === 100 ? 10 : 5)) === 0;
                const tickH = isMajor ? -9 : -5;
                const color = viewStyle === 'word' ? '#333333' : '#543c1b';
                const strokeW = isMajor ? 1.5 : 0.8;

                elements.push(
                  <g key={`ruler-tick-${cm}`}>
                    <line x1={tickX} y1="11" x2={tickX} y2={11 + tickH} stroke={color} strokeWidth={strokeW} />
                    <line x1={tickX} y1="-11" x2={tickX} y2={-11 - tickH} stroke={color} strokeWidth={strokeW} />
                    
                    {isMajor && (
                      <text
                        x={tickX}
                        y="1.5"
                        fontSize={viewStyle === 'word' ? '7.5' : '8.5'}
                        fontWeight={viewStyle === 'word' ? 'normal' : 'black'}
                        fontFamily={viewStyle === 'word' ? 'Calibri, Arial, sans-serif' : 'monospace'}
                        textAnchor="middle"
                        fill={viewStyle === 'word' ? '#000000' : '#38220f'}
                      >
                        {unitSystem === 'si' ? `${cm / 100} m` : `${cm} cm`}
                      </text>
                    )}
                  </g>
                );
              }
              return elements;
            })()}

            <rect x="-273" y="-13" width="5" height="26" rx={viewStyle === 'word' ? 0 : 1.5} fill={viewStyle === 'word' ? '#a5a5a5' : '#57534e'} stroke={viewStyle === 'word' ? '#595959' : '#292524'} strokeWidth="1" />
            <circle cx="-270" cy="0" r="3" fill={viewStyle === 'word' ? '#bfbfbf' : '#cbd5e1'} />

            <rect x="268" y="-13" width="5" height="26" rx={viewStyle === 'word' ? 0 : 1.5} fill={viewStyle === 'word' ? '#a5a5a5' : '#57534e'} stroke={viewStyle === 'word' ? '#595959' : '#292524'} strokeWidth="1" />
            <circle cx="270" cy="0" r="3" fill={viewStyle === 'word' ? '#bfbfbf' : '#cbd5e1'} />

            <line x1="0" y1="-11" x2="0" y2="11" stroke="#dc2626" strokeWidth={viewStyle === 'word' ? 1.5 : 1.8} />
            <circle cx="0" cy="0" r="3" fill="#dc2626" />
            <text x="0" y="24" fontSize="9" fontWeight="bold" fontFamily={viewStyle === 'word' ? 'Calibri, Arial, sans-serif' : 'sans-serif'} fill={viewStyle === 'word' ? '#333333' : '#44403c'} textAnchor="middle">
              C.g. ({unitSystem === 'si' ? `${formatDec(rulerLength / 200, 2)} m` : `${rulerLength / 2} cm`})
            </text>
          </g>

          {(() => {
            const centerCm = rulerLength / 2;
            const cgCoords = getWeightWorldCoords(centerCm);
            return (
              <g key="ruler-cg-force">
                <circle cx={cgCoords.x} cy={cgCoords.y} r={viewStyle === 'word' ? '4.5' : '5.5'} fill="#dc2626" stroke="#991b1b" strokeWidth={viewStyle === 'word' ? 1 : 2} />
                {showDCL && !hiddenDclBodies.includes('ruler') &&
                  getVectorArrow(
                    cgCoords.x,
                    cgCoords.y,
                    rulerWPlates,
                    'down',
                    '#ec4899',
                    `W_regla = ${formatDec(equilibriumStatus.rulerWVal, 2)} N`,
                    undefined,
                    'right',
                    'ruler_cg'
                  )
                }
              </g>
            );
          })()}

          {showDCL && !hiddenDclBodies.includes('ruler') && weights.map((w) => {
            const worldCoordsBottom = getWeightWorldCoords(w.x, 11);
            const forceVal = localForcesMap[w.id];
            if (forceVal <= 0.02) return null;
            return (
              <g key={`contact-force-on-ruler-${w.id}`}>
                {getVectorArrow(
                  worldCoordsBottom.x,
                  worldCoordsBottom.y,
                  forceVal,
                  'down',
                  '#8b5cf6',
                  `F_${w.name} = ${formatDec(forceVal, 2)} N`,
                  26,
                  'right',
                  `ruler_f_contact_${w.id}`
                )}
              </g>
            );
          })}

          {weights.map((w) => {
            const worldCoords = getWeightWorldCoords(w.x);
            const isHovered = hoveredWeightId === w.id;
            const isDragged = draggedId === w.id;

            const wWidth = Math.max(24, Math.min(54, 24 + 28 * (w.mass / 500)));
            const wHeight = Math.max(16, Math.min(42, 16 + 24 * (w.mass / 500)));

            const stringLen = 42;
            const nominalWeightY = worldCoords.y + stringLen;
            const Y_FLOOR = 453;
            const maxAllowedWeightY = Y_FLOOR - wHeight - 5;
            const isRestingOnFloor = nominalWeightY > maxAllowedWeightY;
            const weightY = isRestingOnFloor ? maxAllowedWeightY : nominalWeightY;
            const isSlack = isRestingOnFloor;

            const isWord = viewStyle === 'word';

            return (
              <g
                key={`custom-weight-${w.id}`}
                onMouseEnter={() => setHoveredWeightId(w.id)}
                onMouseLeave={() => setHoveredWeightId(null)}
              >
                {isSlack ? (
                  <path
                    d={`M ${worldCoords.x} ${worldCoords.y} 
                        Q ${worldCoords.x - 12} ${(worldCoords.y + weightY - 15) / 2} 
                          ${worldCoords.x} ${weightY - 15}`}
                    stroke={isWord ? "#595959" : "#44403c"}
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    fill="none"
                  />
                ) : (
                  <line
                    x1={worldCoords.x}
                    y1={worldCoords.y}
                    x2={worldCoords.x}
                    y2={weightY - 15}
                    stroke={isWord ? "#595959" : "#44403c"}
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                )}

                <g
                  transform={`translate(${worldCoords.x}, ${weightY})`}
                  className="cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(w.id);
                  }}
                >
                  <path d="M 0,-15 C -5,-15 -5,-8 0,-5 C 5,-2 5,5 0,5" stroke={isWord ? "#595959" : "#78716c"} strokeWidth={isWord ? 1.5 : 2.2} fill="none" />
                  <circle cx="0" cy="-15" r="3.2" fill="none" stroke={isWord ? "#595959" : "#78716c"} strokeWidth={isWord ? 1.5 : 1.8} />

                  {(() => {
                    let fillCol = w.color;
                    let strokeCol = '#1c1917';
                    if (isWord) {
                      if (w.color === '#f59e0b') { fillCol = '#ffc000'; strokeCol = '#bf9000'; }
                      else if (w.color === '#dc2626') { fillCol = '#ed7d31'; strokeCol = '#c65911'; }
                      else if (w.color === '#2563eb') { fillCol = '#4472c4'; strokeCol = '#2f5597'; }
                      else if (w.color === '#059669') { fillCol = '#70ad47'; strokeCol = '#507e32'; }
                      else { fillCol = '#a5a5a5'; strokeCol = '#7f7f7f'; }
                    }

                    return (
                      <rect
                        x={-wWidth / 2}
                        y="5"
                        width={wWidth}
                        height={wHeight}
                        rx={isWord ? 0 : '3.5'}
                        fill={isDragged ? (isWord ? '#ed7d31' : '#da4a4a') : fillCol}
                        stroke={strokeCol}
                        strokeWidth={isWord ? '1.5' : '1.8'}
                        filter={isWord ? undefined : "drop-shadow(0px 3px 4px rgba(0,0,0,0.15))"}
                      />
                    );
                  })()}

                  {!isWord && <rect x={-wWidth / 2 + 3} y="7" width="5" height={wHeight - 4} fill="#ffffff" opacity="0.25" />}

                  <text
                    x="0"
                    y={5 + wHeight / 2 + 3.5}
                    fontSize={wWidth < 30 ? "8" : "9.5"}
                    fontWeight="bold"
                    fontFamily={isWord ? "Calibri, Arial, sans-serif" : "monospace"}
                    textAnchor="middle"
                    fill="#ffffff"
                  >
                    {unitSystem === 'si' ? `${formatDec(w.mass / 1000, 2)} kg` : `${w.mass} g`}
                  </text>

                  <g transform={`translate(0, ${5 + wHeight + 11})`}>
                    <rect
                      x="-26"
                      y="0"
                      width="52"
                      height="13"
                      rx={isWord ? 0 : '3.5'}
                      fill={isWord ? '#ffffff' : '#faf8f5'}
                      stroke={isWord ? '#a5a5a5' : '#e1decb'}
                      strokeWidth="0.8"
                    />
                    <text
                      x="0"
                      y="9"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily={isWord ? "Calibri, Arial, sans-serif" : "sans-serif"}
                      textAnchor="middle"
                      fill={isWord ? '#333333' : '#44403c'}
                    >
                      Carga {w.name}
                    </text>
                  </g>

                  {isHovered && !isDragged && (
                    <g
                      transform={`translate(${wWidth/2 + 6}, ${5 + wHeight/2})`}
                      className="cursor-pointer"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemoveWeight(w.id);
                      }}
                      title="Quitar carga"
                    >
                      <circle cx="0" cy="0" r="9.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                      <path d="M -4,-4 H 4 M -3,-4 V 3 Q -3,4 -2,4 H 2 Q 3,4 3,3 V -4 M -1.5,-4 V -6 H 1.5 V -4" fill="none" stroke="#ffffff" strokeWidth="1.2" />
                    </g>
                  )}
                </g>

                {(isHovered || isDragged) && (
                  <g
                    transform={`translate(${worldCoords.x}, ${worldCoords.y - 30})`}
                    className="pointer-events-none"
                  >
                    <rect x="-24" y="-6.5" width="48" height="13" rx={isWord ? 0 : '3'} fill={isWord ? '#4472c4' : '#1c1917'} />
                    <text x="0" y="3.5" fontSize="8" fontWeight="bold" fontFamily={isWord ? "Calibri, sans-serif" : "monospace"} fill="#ffffff" textAnchor="middle">
                      {unitSystem === 'si' ? `${formatDec(w.x / 100, 2)} m` : `${w.x} cm`}
                    </text>
                  </g>
                )}

                {showDCL && !hiddenDclBodies.includes(w.id) && (
                  <g key={`dcl-weight-vectors-${w.id}`}>
                    {getVectorArrow(
                      worldCoords.x,
                      weightY + 5 + wHeight / 2,
                      (w.mass / 1000) * g,
                      'down',
                      '#7c2d12',
                      `W_${w.name} = ${formatDec((w.mass / 1000) * g, 2)} N`,
                      undefined,
                      'right',
                      `w_weight_${w.id}`
                    )}
                    {localForcesMap[w.id] > 0.02 && getVectorArrow(
                      worldCoords.x,
                      weightY + 5,
                      localForcesMap[w.id],
                      'up',
                      '#4f46e5',
                      `R_${w.name} = ${formatDec(localForcesMap[w.id], 2)} N`,
                      undefined,
                      'left',
                      `r_reaction_${w.id}`
                    )}
                    {((w.mass / 1000) * g - localForcesMap[w.id]) > 0.02 && getVectorArrow(
                      worldCoords.x,
                      weightY + 5 + wHeight,
                      (w.mass / 1000) * g - localForcesMap[w.id],
                      'up',
                      '#0d9488',
                      `N_${w.name} = ${formatDec((w.mass / 1000) * g - localForcesMap[w.id], 2)} N`,
                      undefined,
                      'left',
                      `n_normal_${w.id}`
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {showDCL && !hiddenDclBodies.includes('t1') && (
            <g key="t1-vector">
              {getVectorArrow(
                X_LEFT_RULER,
                yA,
                t1,
                'up',
                '#1d4ed8',
                `T_1 = ${formatDec(equilibriumStatus.t1Val, 2)} N`,
                undefined,
                'right',
                't1_ruler'
              )}

              {getVectorArrow(
                140,
                yHanger1 - 32,
                t1,
                'up',
                '#2563eb',
                `T_1 = ${formatDec(equilibriumStatus.t1Val, 2)} N`,
                undefined,
                'right',
                't1_hanger'
              )}
              {getVectorArrow(
                140,
                yHanger1 + getDiscsHeightInfo(m1).centerDisksY,
                t1,
                'down',
                '#db2777',
                `W_1 = ${formatDec(equilibriumStatus.t1Val, 2)} N`,
                undefined,
                'right',
                'w1_hanger'
              )}
            </g>
          )}

          {showDCL && !hiddenDclBodies.includes('t2') && (
            <g key="t2-vector">
              {getVectorArrow(
                X_RIGHT_RULER,
                yB,
                t2,
                'up',
                '#0f766e',
                `T_2 = ${formatDec(equilibriumStatus.t2Val, 2)} N`,
                undefined,
                'right',
                't2_ruler'
              )}

              {getVectorArrow(
                760,
                yHanger2 - 32,
                t2,
                'up',
                '#10b981',
                `T_2 = ${formatDec(equilibriumStatus.t2Val, 2)} N`,
                undefined,
                'right',
                't2_hanger'
              )}
              {getVectorArrow(
                760,
                yHanger2 + getDiscsHeightInfo(m2).centerDisksY,
                t2,
                'down',
                '#db2777',
                `W_2 = ${formatDec(equilibriumStatus.t2Val, 2)} N`,
                undefined,
                'right',
                'w2_hanger'
              )}
            </g>
          )}

          {(() => {
            const pivotCm = params.pivot;
            const pivotWorld = getWeightWorldCoords(pivotCm);
            const isWord = viewStyle === 'word';
            return (
              <g key="pivot-indicator-group" className="pointer-events-none">
                {isWord ? (
                  <>
                    <circle
                       cx={pivotWorld.x}
                       cy={pivotWorld.y}
                       r="6"
                       fill="none"
                       stroke="#2f5597"
                       strokeWidth="1.5"
                    />
                    <polygon
                       points={`${pivotWorld.x},${pivotWorld.y - 10} ${pivotWorld.x - 5},${pivotWorld.y - 18} ${pivotWorld.x + 5},${pivotWorld.y - 18}`}
                       fill="#2f5597"
                    />
                    <text
                       x={pivotWorld.x}
                       y={pivotWorld.y - 33}
                       fontSize="9.5"
                       fontFamily="Calibri, Arial, sans-serif"
                       fontWeight="bold"
                       fill="#2f5597"
                       textAnchor="middle"
                    >
                      Pivote {unitSystem === 'si' ? `${formatDec(pivotCm / 100, 2)} m` : `${pivotCm} cm`}
                    </text>
                  </>
                ) : (
                  <>
                    <circle
                       cx={pivotWorld.x}
                       cy={pivotWorld.y}
                       r="7.5"
                       fill="none"
                       stroke="#0284c7"
                       strokeWidth="2.5"
                       strokeDasharray="2.5,2.5"
                       className="animate-spin"
                       style={{ transformOrigin: `${pivotWorld.x}px ${pivotWorld.y}px`, animationDuration: '6s' }}
                    />
                    <polygon
                       points={`${pivotWorld.x},${pivotWorld.y - 10} ${pivotWorld.x - 6},${pivotWorld.y - 20} ${pivotWorld.x + 6},${pivotWorld.y - 20}`}
                       fill="#0284c7"
                    />
                    <text
                       x={pivotWorld.x}
                       y={pivotWorld.y - 35}
                       fontSize="9.5"
                       fontWeight="black"
                       fill="#0284c7"
                       textAnchor="middle"
                    >
                      Pivote {unitSystem === 'si' ? `${formatDec(pivotCm / 100, 2)} m` : `${pivotCm} cm`}
                    </text>
                  </>
                )}

                {showRotationSenses && (
                  <g opacity="0.95" className="transition-opacity duration-300 pointer-events-none">
                    <g transform="translate(240, 135)">
                      <rect x="-55" y="-12" width="110" height="24" rx={isWord ? 0 : 6} fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2" />
                      <text x="-38" y="5" fontSize="14" fontWeight="extrabold" fill="#0369a1" textAnchor="middle">↺</text>
                      <text x="12" y="3.5" fontSize="10.5" fontWeight="bold" fill="#0369a1" textAnchor="middle" fontFamily={isWord ? "Calibri, sans-serif" : "sans-serif"}>Antihorario (+)</text>
                    </g>
                    <g transform="translate(660, 135)">
                      <rect x="-55" y="-12" width="110" height="24" rx={isWord ? 0 : 6} fill="#fee2e2" stroke="#f87171" strokeWidth="1.2" />
                      <text x="38" y="5" fontSize="14" fontWeight="extrabold" fill="#b91c1c" textAnchor="middle">↻</text>
                      <text x="-12" y="3.5" fontSize="10.5" fontWeight="bold" fill="#b91c1c" textAnchor="middle" fontFamily={isWord ? "Calibri, sans-serif" : "sans-serif"}>Horario (-)</text>
                    </g>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-20">
          <div className="flex flex-wrap gap-2 max-w-[70%]">
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur border border-[#e5e4df] text-[10px] font-mono leading-none font-bold rounded-lg text-blue-600 flex items-center gap-1 shadow-sm">
              <ArrowBigUp className="w-3.5 h-3.5 fill-current" /> T<sub>1</sub> = {formatDec(equilibriumStatus.t1Val, 2)} N
            </span>
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur border border-[#e5e4df] text-[10px] font-mono leading-none font-bold rounded-lg text-emerald-600 flex items-center gap-1 shadow-sm">
              <ArrowBigUp className="w-3.5 h-3.5 fill-current" /> T<sub>2</sub> = {formatDec(equilibriumStatus.t2Val, 2)} N
            </span>
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur border border-[#e5e4df] text-[10px] font-mono leading-none font-bold rounded-lg text-red-500 flex items-center gap-1 shadow-sm">
              <ArrowBigDown className="w-3.5 h-3.5 fill-current" /> W<sub>regla</sub> = {formatDec(equilibriumStatus.rulerWVal, 2)} N
            </span>
            {weights.length > 0 && (
              <span className="px-2.5 py-1 bg-white/95 backdrop-blur border border-[#e5e4df] text-[10px] font-mono leading-none font-bold rounded-lg text-amber-600 flex items-center gap-1 shadow-sm animate-fade-in">
                <ArrowBigDown className="w-3.5 h-3.5 fill-current" /> W<sub>cargas</sub> = {formatDec(weights.reduce((sum, w) => sum + (w.mass / 1000) * g, 0), 2)} N
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (enableThemeSwitch) {
                setViewStyle(prev => prev === 'realistic' ? 'word' : 'realistic');
              }
            }}
            disabled={!enableThemeSwitch}
            className={`pointer-events-auto flex items-center gap-2 px-2.5 py-1.5 bg-white/95 backdrop-blur border border-[#e5e4df] select-none text-[10.5px] font-bold text-[#44403c] rounded-xl shadow-sm transition ${
              enableThemeSwitch 
                ? 'hover:bg-stone-50 active:scale-95 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={enableThemeSwitch ? "Cambiar estilo de visualización (Clásico vs Word)" : "Cambiar de tema (Bloqueado)"}
            id="word-style-toggle-btn"
          >
            {!enableThemeSwitch && <Lock className="w-3.5 h-3.5 text-stone-500" />}
            {viewStyle === 'realistic' ? (
              <>
                <ToggleLeft className="w-4 h-4 text-stone-400" />
                <span>Clásico</span>
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">Esquema</span>
              </>
            )}
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 hidden lg:flex flex-wrap items-center justify-start xl:justify-between gap-x-5 gap-y-1 px-4 py-2.5 bg-[#fcfbf9]/95 backdrop-blur border border-[#e5e4df] rounded-xl pointer-events-none text-[10px] leading-relaxed text-[#57534e] font-mono">
          <div>
            regla: <span className="text-[#1c1917] font-bold">{unitSystem === 'si' ? `${formatDec(params.rulerMass/1000, 2)} kg` : `${formatGrams(params.rulerMass)} g`}</span> (~{formatDec(rulerWPlates, 1)} N)
          </div>
          <div>
            soporte izq. (m₁): <span className="text-blue-600 font-bold">{unitSystem === 'si' ? `${formatDec(params.m1/1000, 2)} kg` : `${formatGrams(params.m1)} g`}</span>
          </div>
          <div>
            soporte der. (m₂): <span className="text-emerald-600 font-bold">{unitSystem === 'si' ? `${formatDec(params.m2/1000, 2)} kg` : `${formatGrams(params.m2)} g`}</span>
          </div>
          <div>
            gravedad (g): <span className="text-purple-600 font-bold">{formatDec(gravity, 2)} m/s²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
