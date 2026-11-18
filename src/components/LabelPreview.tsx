import React from 'react';
import { CATEGORY_LABELS, DEFAULT_LABEL_DESIGN, LabelFormat, ProductDocument } from '../types/product';
import { computeLupaAlerts } from '../utils/nutrition';
import { AnvisaNutritionTable } from './AnvisaNutritionTable';
import {
  AnimalInspectionStamp,
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

const MM_TO_PX = 4.2;

function getFormatDimensions(format: LabelFormat, customW: number, customH: number) {
  if (format === '100x70') {
    return { label: '100 × 70 mm (Compacto)', widthPx: 440, minHeightPx: 308, isWide: true };
  }
  if (format === '140x80') {
    return { label: '140 × 80 mm (Horizontal)', widthPx: 600, minHeightPx: 344, isWide: true };
  }
  if (format === 'custom') {
    const wMm = Math.max(55, Math.min(210, customW || 100));
    const hMm = Math.max(40, Math.min(297, customH || 150));
    return {
      label: `${wMm} × ${hMm} mm (Personalizado)`,
      widthPx: Math.round(wMm * MM_TO_PX),
      minHeightPx: Math.round(hMm * MM_TO_PX),
      isWide: wMm / hMm >= 1.35,
    };
  }
  return { label: '100 × 150 mm (Frontal / Padrão)', widthPx: 440, minHeightPx: 630, isWide: false };
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ product, format, zoom }) => {
  const design = product.labelDesign || DEFAULT_LABEL_DESIGN;
  const spec = getFormatDimensions(format, design.customWidthMm, design.customHeightMm);
  const lupaAlerts = computeLupaAlerts(product.nutrition);
  const accent = product.labelAccentColor || '#1E3A5F';

  const titlePx = Math.max(12, Math.min(24, design.titleFontPx || 16));
  const bodyPx = Math.max(8, Math.min(12.5, design.bodyFontPx || 9.5));
  const logoHeightPx = Math.max(24, Math.min(92, design.logoHeightPx || 40));
  const barcodeW = Math.max(112, Math.min(200, design.barcodeWidthPx || 136));
  const barcodeH = Math.round(barcodeW * 0.33);

  const qrPayload = `${product.sku}|${product.ean13}|${product.batchFormat}|${product.brand}`;
  const hasAnimalStamp = product.animalStamp && product.animalStamp.type !== 'nenhum';
  const sectionOrder = design.sectionOrder || ['lupa', 'composicao', 'nutricao', 'ghs'];

  // Determine whether nutrition table should span full width (e.g. horizontal or vertical-quebrado in portrait)
  const nutritionFullWidth =
    product.nutrition.tableLayout === 'horizontal' ||
    product.nutrition.tableLayout === 'vertical-quebrado';

  const renderSection = (sectionKey: 'lupa' | 'composicao' | 'nutricao' | 'ghs') => {
    if (sectionKey === 'lupa') {
      if (!product.nutrition.enabled || !lupaAlerts.any) return null;
      return (
        <div key="lupa" className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <AnvisaLupas
            alerts={lupaAlerts}
            layout={design.lupaLayout || 'horizontal'}
            scale={design.lupaScale || 1}
          />
        </div>
      );
    }

    if (sectionKey === 'composicao') {
      return (
        <div key="composicao" style={{ fontSize: `${bodyPx}px` }} className="space-y-2 leading-[1.38] text-slate-900">
          {product.ingredientsText && (
            <div>
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

          {(product.allergensText ||
            product.glutenDeclaration !== 'N/A' ||
            product.lactoseDeclaration !== 'N/A') && (
            <div
              style={{ fontSize: `${Math.max(8, bodyPx - 0.3)}px` }}
              className="leading-snug font-bold text-black border border-black px-2 py-1.5 bg-slate-50"
            >
              {product.allergensText && <div>{product.allergensText}</div>}
              <div className="flex flex-wrap gap-x-3 mt-0.5">
                {product.glutenDeclaration !== 'N/A' && <span>{product.glutenDeclaration}</span>}
                {product.lactoseDeclaration !== 'N/A' && <span>{product.lactoseDeclaration}</span>}
              </div>
            </div>
          )}

          {(product.usageInstructions || product.precautionsText) && (
            <div className="space-y-1 text-slate-800">
              {product.usageInstructions && (
                <div>
                  <span className="font-bold uppercase text-slate-950">Modo de uso: </span>
                  <span>{product.usageInstructions}</span>
                </div>
              )}
              {product.precautionsText && (
                <div>
                  <span className="font-bold uppercase text-slate-950">Conservação e Precauções: </span>
                  <span>{product.precautionsText}</span>
                </div>
              )}
              {product.alcoholWarning && (
                <div className="font-bold uppercase text-black border border-black px-2 py-1 mt-1">
                  {product.alcoholWarning}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (sectionKey === 'nutricao') {
      if (!product.nutrition.enabled) return null;
      return (
        <div key="nutricao" className={nutritionFullWidth ? 'w-full' : 'max-w-full'}>
          <AnvisaNutritionTable
            nutrition={product.nutrition}
            scale={design.nutritionScale || 1}
          />
        </div>
      );
    }

    if (sectionKey === 'ghs') {
      if (!product.ghs.enabled) return null;
      return (
        <div key="ghs" className="border border-red-700 bg-red-50/40 p-2.5 space-y-2">
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
            <div style={{ fontSize: `${Math.max(8, bodyPx - 0.5)}px` }} className="leading-snug text-slate-900 space-y-0.5">
              {product.ghs.hazardStatements.map((h, i) => (
                <div key={i}>{h}</div>
              ))}
            </div>
          )}
          {product.ghs.precautionStatements.length > 0 && (
            <div
              style={{ fontSize: `${Math.max(8, bodyPx - 0.8)}px` }}
              className="leading-snug text-slate-700 space-y-0.5 border-t border-red-200 pt-1"
            >
              {product.ghs.precautionStatements.slice(0, 3).map((p, i) => (
                <div key={i}>{p}</div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="no-print mb-3 flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
        <span>Formato: {spec.label}</span>
        <span aria-hidden="true">·</span>
        <span>Escala: {Math.round(zoom * 100)}%</span>
        <span aria-hidden="true">·</span>
        <span>SKU {product.sku}</span>
      </div>

      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          width: `${spec.widthPx}px`,
        }}
        className="relative transition-transform duration-150"
      >
        {/* Crop marks */}
        <span className="no-print pointer-events-none absolute -top-2.5 -left-2.5 w-2.5 h-2.5 border-r border-b border-slate-400" />
        <span className="no-print pointer-events-none absolute -top-2.5 -right-2.5 w-2.5 h-2.5 border-l border-b border-slate-400" />
        <span className="no-print pointer-events-none absolute -bottom-2.5 -left-2.5 w-2.5 h-2.5 border-r border-t border-slate-400" />
        <span className="no-print pointer-events-none absolute -bottom-2.5 -right-2.5 w-2.5 h-2.5 border-l border-t border-slate-400" />

        <div
          style={{ minHeight: `${spec.minHeightPx}px` }}
          className="print-sheet bg-white text-slate-950 border border-slate-300 shadow-sm flex flex-col justify-between overflow-hidden"
        >
          {/* Top Brand Header & Logo */}
          <div>
            <div
              style={design.showHeaderBanner ? { backgroundColor: accent } : undefined}
              className={`px-4 py-3 ${
                design.showHeaderBanner
                  ? 'text-white'
                  : 'bg-white text-slate-950 border-b-2 border-slate-900'
              }`}
            >
              {design.logoDataUrl && design.logoPosition === 'top-center' && (
                <div className="flex justify-center mb-2">
                  <img
                    src={design.logoDataUrl}
                    alt={`Logo ${product.brand}`}
                    style={{ height: `${logoHeightPx}px` }}
                    className="object-contain max-w-[200px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                {design.logoDataUrl && design.logoPosition === 'left' && (
                  <img
                    src={design.logoDataUrl}
                    alt={`Logo ${product.brand}`}
                    style={{ height: `${logoHeightPx}px` }}
                    className="object-contain max-w-[110px] shrink-0 bg-white/95 p-1 rounded-xs"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[9.5px] font-mono tracking-wider uppercase ${
                      design.showHeaderBanner ? 'opacity-90' : 'text-slate-600'
                    }`}
                  >
                    {product.brand || 'MARCA'} · {CATEGORY_LABELS[product.category]}
                  </div>
                  <h2
                    style={{ fontSize: `${titlePx}px` }}
                    className="font-bold leading-tight tracking-tight mt-0.5"
                  >
                    {product.name}
                  </h2>
                  {design.showSubtitleOnLabel && product.subtitle && (
                    <p
                      style={{ fontSize: `${Math.max(8.5, bodyPx)}px` }}
                      className={`leading-snug mt-0.5 ${
                        design.showHeaderBanner ? 'opacity-90' : 'text-slate-700'
                      }`}
                    >
                      {product.subtitle}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {design.logoDataUrl && design.logoPosition === 'right' && (
                    <img
                      src={design.logoDataUrl}
                      alt={`Logo ${product.brand}`}
                      style={{ height: `${logoHeightPx}px` }}
                      className="object-contain max-w-[110px] bg-white/95 p-1 rounded-xs"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div
                    className={`text-xs font-bold font-mono px-2 py-1 whitespace-nowrap ${
                      design.showHeaderBanner
                        ? 'bg-white/15 border border-white/25 text-white'
                        : 'bg-slate-100 border border-slate-300 text-slate-950'
                    }`}
                  >
                    {product.netWeightDisplay}
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Label Sections */}
            <div className="p-4 space-y-3">
              {spec.isWide ? (
                // Wide layout: Lupa on top full width if present, composition left, nutrition/GHS right
                <div className="space-y-2.5">
                  {sectionOrder.includes('lupa') && renderSection('lupa')}
                  <div className="grid grid-cols-12 gap-3.5 items-start">
                    <div className="col-span-6 space-y-2">{renderSection('composicao')}</div>
                    <div className="col-span-6 space-y-2">
                      {renderSection('nutricao')}
                      {renderSection('ghs')}
                      {!product.nutrition.enabled &&
                        !product.ghs.enabled &&
                        product.technicalParams.length > 0 && (
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
              ) : (
                // Portrait layout: respects exact user sectionOrder
                <div className="space-y-3">
                  {sectionOrder.map((sec) => renderSection(sec))}
                  {!product.nutrition.enabled &&
                    !product.ghs.enabled &&
                    product.technicalParams.length > 0 && (
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
              )}
            </div>
          </div>

          {/* Bottom Legal Footer: Batch/Validity, Industry Origin, Animal Stamp, Manufacturer, Barcode */}
          <div className="border-t border-slate-300 bg-slate-50 px-4 py-2.5 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1 text-[8px] leading-tight text-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 font-mono font-semibold text-[8.5px] text-slate-950 bg-white border border-slate-300 px-2 py-0.5">
                  <span>{product.batchFormat}</span>
                  <span aria-hidden="true">|</span>
                  <span>{product.validityDisplay}</span>
                </div>
                {product.industryOriginText && (
                  <span className="font-bold text-[8.5px] tracking-wide uppercase text-slate-950">
                    {product.industryOriginText}
                  </span>
                )}
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
              {hasAnimalStamp && <AnimalInspectionStamp stamp={product.animalStamp} />}
              {product.showQrCode && (
                <div className="flex flex-col items-center">
                  <QrCodeSvg value={qrPayload} size={46} />
                  <span className="text-[7px] font-mono text-slate-600 mt-0.5">Ficha / Lote</span>
                </div>
              )}
              <div className="border border-slate-200 bg-white p-1">
                <Ean13Barcode value={product.ean13} width={barcodeW} height={barcodeH} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
