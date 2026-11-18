import React from 'react';
import { CATEGORY_LABELS, LabelFormat, ProductDocument } from '../types/product';
import { computeLupaAlerts, computeNutritionRows } from '../utils/nutrition';
import {
  AnvisaLupas,
  CosmeticPaoIcon,
  Ean13Barcode,
  GhsPictogramSvg,
  PackagingHandlingIcons,
  QrCodeSvg,
} from './RegulatoryIcons';

interface LabelPreviewProps {
  product: ProductDocument;
  format: LabelFormat;
  zoom: number;
}

const FORMAT_DIMENSIONS: Record<LabelFormat, { label: string; widthPx: number; minHeightPx: number; isWide: boolean }> = {
  '100x150': { label: '100 × 150 mm (Frontal / Padrão)', widthPx: 440, minHeightPx: 650, isWide: false },
  '100x70': { label: '100 × 70 mm (Compacto)', widthPx: 440, minHeightPx: 320, isWide: true },
  '140x80': { label: '140 × 80 mm (Rótulo Horizontal)', widthPx: 620, minHeightPx: 356, isWide: true },
};

export const LabelPreview: React.FC<LabelPreviewProps> = ({ product, format, zoom }) => {
  const spec = FORMAT_DIMENSIONS[format];
  const lupaAlerts = computeLupaAlerts(product.nutrition);
  const nutritionRows = product.nutrition.enabled ? computeNutritionRows(product.nutrition) : [];
  const accent = product.labelAccentColor || '#1E3A5F';

  const qrPayload = `${product.sku}|${product.ean13}|${product.batchFormat}|${product.brand}`;

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Subtle ruler / dimension header above the label */}
      <div className="no-print mb-3 flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
        <span>Formato: {spec.label}</span>
        <span aria-hidden="true">·</span>
        <span>Escala: {Math.round(zoom * 100)}%</span>
        <span aria-hidden="true">·</span>
        <span>SKU {product.sku}</span>
      </div>

      {/* Physical label sheet with crop marks */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          width: `${spec.widthPx}px`,
        }}
        className="relative transition-transform duration-150"
      >
        {/* Crop marks (visual print guides) */}
        <span className="no-print pointer-events-none absolute -top-2.5 -left-2.5 w-2.5 h-2.5 border-r border-b border-slate-400" />
        <span className="no-print pointer-events-none absolute -top-2.5 -right-2.5 w-2.5 h-2.5 border-l border-b border-slate-400" />
        <span className="no-print pointer-events-none absolute -bottom-2.5 -left-2.5 w-2.5 h-2.5 border-r border-t border-slate-400" />
        <span className="no-print pointer-events-none absolute -bottom-2.5 -right-2.5 w-2.5 h-2.5 border-l border-t border-slate-400" />

        <div
          style={{ minHeight: `${spec.minHeightPx}px` }}
          className="print-sheet bg-white text-slate-950 border border-slate-300 shadow-sm flex flex-col justify-between overflow-hidden"
        >
          {/* Top Brand & Regulatory Strip */}
          <div>
            <div
              style={{ backgroundColor: accent }}
              className="px-4 py-3 text-white flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-mono tracking-wider opacity-90 uppercase">
                  {product.brand || 'MARCA'} · {CATEGORY_LABELS[product.category]}
                </div>
                <h2 className="text-base font-bold leading-snug tracking-tight text-white mt-0.5">
                  {product.name}
                </h2>
                {product.subtitle && (
                  <p className="text-[10.5px] opacity-90 leading-snug mt-0.5">{product.subtitle}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-bold font-mono bg-white/15 px-2 py-1 border border-white/25 whitespace-nowrap">
                  {product.netWeightDisplay}
                </div>
              </div>
            </div>

            {/* ANVISA Front-of-Pack Lupas (if applicable) */}
            {product.nutrition.enabled && lupaAlerts.any && (
              <div className="px-4 pt-2.5 pb-1 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide">
                  Rotulagem Frontal ANVISA
                </span>
                <AnvisaLupas alerts={lupaAlerts} compact={format === '100x70'} />
              </div>
            )}

            {/* Main Label Body */}
            <div className={`p-4 ${spec.isWide ? 'grid grid-cols-12 gap-4' : 'space-y-3'}`}>
              {/* Left / Main Info Column */}
              <div className={spec.isWide ? 'col-span-7 space-y-2.5' : 'space-y-2.5'}>
                {/* Ingredients / Composition */}
                {product.ingredientsText && (
                  <div className="text-[9.5px] leading-relaxed text-slate-900">
                    <span className="font-bold uppercase tracking-wide">
                      {product.category === 'cosmeticos'
                        ? 'Composição (INCI): '
                        : product.category === 'quimicos' || product.category === 'industrial'
                        ? 'Composição Química: '
                        : 'Ingredientes: '}
                    </span>
                    <span>{product.ingredientsText}</span>
                  </div>
                )}

                {/* Allergens & Gluten / Lactose (ANVISA RDC 727) */}
                {(product.allergensText ||
                  product.glutenDeclaration !== 'N/A' ||
                  product.lactoseDeclaration !== 'N/A') && (
                  <div className="text-[9px] leading-snug font-bold text-black border border-black px-2 py-1.5 bg-slate-50">
                    {product.allergensText && <div>{product.allergensText}</div>}
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {product.glutenDeclaration !== 'N/A' && <span>{product.glutenDeclaration}</span>}
                      {product.lactoseDeclaration !== 'N/A' && <span>{product.lactoseDeclaration}</span>}
                    </div>
                  </div>
                )}

                {/* Usage & Precautions */}
                <div className="grid grid-cols-1 gap-1.5 text-[9px] leading-snug text-slate-800">
                  {product.usageInstructions && (
                    <div>
                      <span className="font-bold uppercase text-slate-950">Modo de uso / Aplicação: </span>
                      <span>{product.usageInstructions}</span>
                    </div>
                  )}
                  {product.precautionsText && (
                    <div>
                      <span className="font-bold uppercase text-slate-950">Conservação e Precauções: </span>
                      <span>{product.precautionsText}</span>
                    </div>
                  )}
                </div>

                {/* GHS Block (when enabled and NOT in wide right column) */}
                {product.ghs.enabled && !spec.isWide && (
                  <div className="border border-red-700 bg-red-50/40 p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-red-200 pb-1.5">
                      <div>
                        <span className="text-[11px] font-bold text-red-700 tracking-wide">
                          {product.ghs.signalWord !== 'NENHUMA' ? product.ghs.signalWord : 'INFORMAÇÃO GHS'}
                        </span>
                        {product.ghs.unNumber && (
                          <span className="ml-2 text-[9px] font-mono text-slate-700">
                            {product.ghs.unNumber} · {product.ghs.hazardClass}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {product.ghs.pictograms.map((pic) => (
                          <GhsPictogramSvg key={pic} type={pic} size={36} />
                        ))}
                      </div>
                    </div>
                    {product.ghs.hazardStatements.length > 0 && (
                      <div className="text-[8.5px] leading-snug text-slate-900 space-y-0.5">
                        {product.ghs.hazardStatements.map((h, i) => (
                          <div key={i}>{h}</div>
                        ))}
                      </div>
                    )}
                    {product.ghs.precautionStatements.length > 0 && (
                      <div className="text-[8px] leading-snug text-slate-700 space-y-0.5 border-t border-red-200 pt-1">
                        {product.ghs.precautionStatements.slice(0, 3).map((p, i) => (
                          <div key={i}>{p}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right / Regulatory Table Column */}
              <div className={spec.isWide ? 'col-span-5 space-y-2.5' : 'space-y-2.5'}>
                {/* ANVISA RDC 429 Nutrition Table */}
                {product.nutrition.enabled && (
                  <div className="border-[1.5px] border-black bg-white text-black">
                    <div className="px-2 py-1 border-b-[1.5px] border-black font-bold text-[9.5px] tracking-tight text-center">
                      INFORMAÇÃO NUTRICIONAL
                    </div>
                    <div className="px-2 py-1 border-b border-black text-[8px] leading-tight">
                      <div>Porções por embalagem: {product.nutrition.servingsPerPackage}</div>
                      <div>
                        Porção: {product.nutrition.servingSize} {product.nutrition.servingUnit} ({product.nutrition.householdMeasure})
                      </div>
                    </div>
                    <table className="w-full text-[8px] tabular-nums border-collapse">
                      <thead>
                        <tr className="border-b-[1.5px] border-black font-bold text-right">
                          <th className="text-left px-1.5 py-0.5"></th>
                          <th className="px-1 py-0.5">100 {product.nutrition.servingUnit}</th>
                          <th className="px-1 py-0.5">
                            {product.nutrition.servingSize} {product.nutrition.servingUnit}
                          </th>
                          <th className="px-1.5 py-0.5">%VD*</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {nutritionRows.map((row) => (
                          <tr key={row.key}>
                            <td className={`px-1.5 py-0.5 text-left ${row.indent ? 'pl-3' : 'font-medium'}`}>
                              {row.label} ({row.unit})
                            </td>
                            <td className="px-1 py-0.5 text-right">{row.per100}</td>
                            <td className="px-1 py-0.5 text-right">{row.perServing}</td>
                            <td className="px-1.5 py-0.5 text-right font-medium">{row.vdPercent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-2 py-1 border-t border-black text-[7px] leading-tight text-slate-800">
                      *Percentual de valores diários fornecidos pela porção.
                    </div>
                  </div>
                )}

                {/* GHS Block inside wide layout */}
                {product.ghs.enabled && spec.isWide && (
                  <div className="border border-red-700 bg-red-50/40 p-2 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-red-200 pb-1">
                      <span className="text-[10px] font-bold text-red-700">
                        {product.ghs.signalWord !== 'NENHUMA' ? product.ghs.signalWord : 'GHS'}
                      </span>
                      <span className="text-[8px] font-mono text-slate-700">{product.ghs.unNumber}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center py-0.5">
                      {product.ghs.pictograms.map((pic) => (
                        <GhsPictogramSvg key={pic} type={pic} size={34} />
                      ))}
                    </div>
                    {product.ghs.hazardStatements.slice(0, 2).map((h, i) => (
                      <div key={i} className="text-[7.5px] leading-tight text-slate-900">
                        {h}
                      </div>
                    ))}
                  </div>
                )}

                {/* Technical Specs Summary on Industrial/Cosmetic Labels when Nutrition & GHS are off or compact */}
                {!product.nutrition.enabled && !spec.isWide && product.technicalParams.length > 0 && (
                  <div className="border border-slate-300 text-[8.5px]">
                    <div className="bg-slate-100 px-2 py-1 font-bold border-b border-slate-300 text-slate-900">
                      ESPECIFICAÇÕES PRINCIPAIS
                    </div>
                    <div className="divide-y divide-slate-200">
                      {product.technicalParams.slice(0, 4).map((tp) => (
                        <div key={tp.id} className="flex justify-between px-2 py-1 gap-2 tabular-nums">
                          <span className="text-slate-700 truncate">{tp.name}</span>
                          <span className="font-mono font-medium text-slate-950 whitespace-nowrap">
                            {tp.specification} {tp.unit !== '-' ? tp.unit : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Manufacturer, Batch/Validity, Barcode & Symbols Footer */}
          <div className="border-t border-slate-300 bg-slate-50 px-4 py-2.5 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1 text-[8px] leading-tight text-slate-800">
              <div className="flex items-center gap-2 font-mono font-semibold text-[9px] text-slate-950 bg-white border border-slate-300 px-2 py-1 w-fit">
                <span>{product.batchFormat}</span>
                <span aria-hidden="true">|</span>
                <span>{product.validityDisplay}</span>
              </div>
              <div className="font-semibold text-slate-950 pt-0.5">{product.manufacturer.companyName}</div>
              <div>
                CNPJ: {product.manufacturer.cnpj} · {product.manufacturer.address}
              </div>
              <div>
                SAC: {product.manufacturer.sacPhone} · {product.manufacturer.sacEmail}
              </div>
              <div className="text-slate-700">
                Resp. Técnico: {product.manufacturer.technicalResponsible} ({product.manufacturer.professionalRegistry})
              </div>
              {product.manufacturer.msRegistration && (
                <div className="text-slate-600">{product.manufacturer.msRegistration}</div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <PackagingHandlingIcons
                  recyclable={product.showRecyclableSymbol}
                  keepDry={product.showKeepDrySymbol}
                />
                {product.category === 'cosmeticos' && product.paoMonths && (
                  <CosmeticPaoIcon months={product.paoMonths} size={26} />
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-end gap-2">
              {product.showQrCode && (
                <div className="flex flex-col items-center">
                  <QrCodeSvg value={qrPayload} size={48} />
                  <span className="text-[7px] font-mono text-slate-600 mt-0.5">Ficha / Lote</span>
                </div>
              )}
              <div className="border border-slate-200 bg-white p-1">
                <Ean13Barcode value={product.ean13} width={132} height={44} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
