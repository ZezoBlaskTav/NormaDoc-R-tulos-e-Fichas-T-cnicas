import React from 'react';
import { GhsPictogramId } from '../types/product';
import { encodeEan13Bits, generateDeterministicQrMatrix, normalizeEan13 } from '../utils/barcode';
import { LupaAlerts } from '../utils/nutrition';

/**
 * Crisp SVG EAN-13 Barcode with human-readable digits
 */
export const Ean13Barcode: React.FC<{ value: string; width?: number; height?: number }> = ({
  value,
  width = 164,
  height = 52,
}) => {
  const { code } = normalizeEan13(value);
  const bits = encodeEan13Bits(code);
  const quietZone = 10;
  const totalUnits = bits.length + quietZone * 2;
  const barHeight = 38;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${totalUnits} ${barHeight + 13}`}
      className="block select-none bg-white"
      role="img"
      aria-label={`Código de barras EAN-13 ${code}`}
    >
      <rect x={0} y={0} width={totalUnits} height={barHeight + 13} fill="#FFFFFF" />
      {bits.split('').map((bit, idx) => {
        if (bit !== '1') return null;
        // Guard bars extend slightly lower
        const isGuard = idx < 3 || (idx >= 45 && idx < 50) || idx >= 92;
        return (
          <rect
            key={idx}
            x={quietZone + idx}
            y={2}
            width={1.04}
            height={isGuard ? barHeight + 4 : barHeight}
            fill="#0F172A"
          />
        );
      })}
      <text
        x={3}
        y={barHeight + 11}
        fontSize="9"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
        fill="#0F172A"
      >
        {code[0]}
      </text>
      <text
        x={quietZone + 5}
        y={barHeight + 11}
        fontSize="9"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
        letterSpacing="1.1"
        fill="#0F172A"
      >
        {code.slice(1, 7)}
      </text>
      <text
        x={quietZone + 51}
        y={barHeight + 11}
        fontSize="9"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
        letterSpacing="1.1"
        fill="#0F172A"
      >
        {code.slice(7, 13)}
      </text>
    </svg>
  );
};

/**
 * Deterministic SVG QR Code Matrix
 */
export const QrCodeSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 56 }) => {
  const matrix = generateDeterministicQrMatrix(value || 'NORMA-DOC');
  const len = matrix.length;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${len + 2} ${len + 2}`}
      className="block bg-white border border-slate-200"
      role="img"
      aria-label={`QR Code para ${value}`}
    >
      <rect x={0} y={0} width={len + 2} height={len + 2} fill="#FFFFFF" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c + 1} y={r + 1} width={1} height={1} fill="#0F172A" /> : null
        )
      )}
    </svg>
  );
};

/**
 * ANVISA RDC 429 / IN 75 Front-of-Pack Warning (Lupa)
 */
export const AnvisaLupas: React.FC<{ alerts: LupaAlerts; compact?: boolean }> = ({ alerts, compact = false }) => {
  if (!alerts.any) return null;

  const items: string[] = [];
  if (alerts.highAddedSugar) items.push('AÇÚCAR ADICIONADO');
  if (alerts.highSatFat) items.push('GORDURA SATURADA');
  if (alerts.highSodium) items.push('SÓDIO');

  return (
    <div
      className={`inline-flex items-stretch border-[1.5px] border-black bg-white text-black ${
        compact ? 'text-[7.5px]' : 'text-[8.5px]'
      } leading-tight font-sans select-none`}
      aria-label={`Rotulagem nutricional frontal: Alto em ${items.join(', ')}`}
    >
      {/* Magnifying Glass Icon Box */}
      <div className="bg-black text-white flex items-center justify-center px-1.5 py-1">
        <svg
          width={compact ? 14 : 18}
          height={compact ? 14 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" />
        </svg>
      </div>
      <div className="bg-black text-white font-bold flex items-center px-1.5 py-1 tracking-tight whitespace-nowrap">
        ALTO EM
      </div>
      <div className="flex items-stretch divide-x divide-black">
        {items.map((label) => (
          <div
            key={label}
            className="px-1.5 py-1 font-bold flex items-center justify-center text-center tracking-tight bg-white text-black"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const GHS_LABELS: Record<GhsPictogramId, string> = {
  flammable: 'Inflamável',
  corrosive: 'Corrosivo',
  exclamation: 'Irritante / Nocivo',
  skull: 'Toxicidade Aguda',
  health: 'Perigo à Saúde',
  environment: 'Perigo Ambiental',
  oxidizer: 'Oxidante',
};

/**
 * Authentic Red-Diamond GHS Hazard Pictogram (ABNT NBR 14725)
 */
export const GhsPictogramSvg: React.FC<{ type: GhsPictogramId; size?: number }> = ({ type, size = 44 }) => {
  return (
    <div className="inline-flex flex-col items-center gap-0.5" title={GHS_LABELS[type]}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Pictograma GHS: ${GHS_LABELS[type]}`}>
        <polygon points="32,3 61,32 32,61 3,32" fill="#FFFFFF" stroke="#DC2626" strokeWidth="4.5" />
        {type === 'exclamation' && (
          <g fill="#0F172A">
            <path d="M29.5 17h5l-1 19h-3l-1-19z" />
            <circle cx="32" cy="43" r="3" />
          </g>
        )}
        {type === 'corrosive' && (
          <g fill="#0F172A">
            {/* Test tubes */}
            <path d="M18 19l5-3 6 9-5 3-6-9z" />
            <path d="M46 19l-5-3-6 9 5 3 6-9z" />
            {/* Drops */}
            <circle cx="24" cy="31" r="1.6" />
            <circle cx="39" cy="31" r="1.6" />
            {/* Metal bar & Hand */}
            <rect x="16" y="38" width="14" height="4" rx="1" />
            <path d="M35 37h12v4H39l-2 3h-3l1-7z" />
          </g>
        )}
        {type === 'flammable' && (
          <path
            d="M32 14c2 6 8 9 7 17 2-2 3-5 3-5 4 4 4 12-1 17-2 2-5 3-9 3-6 0-11-4-11-11 0-6 4-10 6-13 0 3 2 5 2 5-1-5 1-10 3-13z"
            fill="#0F172A"
          />
        )}
        {type === 'skull' && (
          <g fill="#0F172A">
            <circle cx="32" cy="25" r="8" />
            <rect x="28" y="31" width="8" height="4" />
            <circle cx="29" cy="24" r="1.8" fill="#FFFFFF" />
            <circle cx="35" cy="24" r="1.8" fill="#FFFFFF" />
            <path d="M20 43l24-8M20 35l24 8" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
          </g>
        )}
        {type === 'environment' && (
          <g fill="#0F172A">
            <path d="M25 41V27l-5-5M25 32l5-5M25 27l-1-6" stroke="#0F172A" strokeWidth="2.2" fill="none" />
            <path d="M18 42h28" stroke="#0F172A" strokeWidth="2" />
            <path d="M34 39c3-3 8-3 11 0-3 3-8 3-11 0z" />
          </g>
        )}
        {type === 'health' && (
          <g fill="#0F172A">
            <circle cx="32" cy="19" r="4" />
            <path d="M24 26c0-2 3-3 8-3s8 1 8 3v17H24V26z" />
            <path d="M32 25l2 5 5-2-3 4 4 3-5 1 1 5-4-4-4 4 1-5-5-1 4-3-3-4 5 2z" fill="#FFFFFF" />
          </g>
        )}
        {type === 'oxidizer' && (
          <g fill="none" stroke="#0F172A" strokeWidth="2.5">
            <circle cx="32" cy="36" r="7" />
            <path d="M32 15c2 5 6 7 5 13-3-1-6-1-10 0-1-6 3-8 5-13z" fill="#0F172A" stroke="none" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Cosmetic PAO (Period After Opening) Jar Icon
 */
export const CosmeticPaoIcon: React.FC<{ months: string; size?: number }> = ({ months, size = 28 }) => {
  if (!months) return null;
  return (
    <div className="inline-flex flex-col items-center" title={`Validade após aberto: ${months}`}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <path d="M7 14L27 7L28.5 10.5L8.5 17.5Z" stroke="#0F172A" strokeWidth="1.8" />
        <path d="M9 17H27V29C27 30.1 26.1 31 25 31H11C9.9 31 9 30.1 9 29V17Z" stroke="#0F172A" strokeWidth="1.8" />
        <text
          x="18"
          y="26"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="IBM Plex Mono, monospace"
          fill="#0F172A"
        >
          {months}
        </text>
      </svg>
    </div>
  );
};

export const PackagingHandlingIcons: React.FC<{ recyclable: boolean; keepDry: boolean }> = ({
  recyclable,
  keepDry,
}) => {
  if (!recyclable && !keepDry) return null;
  return (
    <div className="inline-flex items-center gap-2 text-slate-800">
      {recyclable && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="Embalagem reciclável">
          <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
          <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
          <path d="m14 16-3 3 3 3" />
          <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
          <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
          <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
        </svg>
      )}
      {keepDry && (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="Manter ao abrigo da umidade">
          <path d="M12 3v14a3 3 0 0 1-3 3" />
          <path d="M4 12a8 8 0 0 1 16 0Z" />
          <path d="M7 3v2M17 3v2M12 2v1" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
