import React from 'react';
import { CATEGORY_LABELS, ProductDocument, STATUS_LABELS } from '../types/product';
import { normalizeEan13 } from '../utils/barcode';
import { computeLupaAlerts, computeNutritionRows } from '../utils/nutrition';
import { AnvisaLupas, Ean13Barcode, GhsPictogramSvg, QrCodeSvg } from './RegulatoryIcons';

interface DatasheetPreviewProps {
  product: ProductDocument;
  zoom: number;
}

export const DatasheetPreview: React.FC<DatasheetPreviewProps> = ({ product, zoom }) => {
  const { code: validEan } = normalizeEan13(product.ean13);
  const lupaAlerts = computeLupaAlerts(product.nutrition);
  const nutritionRows = product.nutrition.enabled ? computeNutritionRows(product.nutrition) : [];
  const accent = product.labelAccentColor || '#1E3A5F';

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="no-print mb-3 flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
        <span>Formato: A4 (210 × 297 mm)</span>
        <span aria-hidden="true">·</span>
        <span>Revisão {product.revision}</span>
        <span aria-hidden="true">·</span>
        <span>Escala {Math.round(zoom * 100)}%</span>
      </div>

      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          width: '794px',
        }}
        className="transition-transform duration-150"
      >
        <div className="print-sheet bg-white text-slate-900 border border-slate-300 shadow-sm p-10 space-y-6">
          {/* Document Control Header Table */}
          <div className="border border-slate-900">
            <div className="grid grid-cols-12 divide-x divide-slate-900">
              <div className="col-span-3 p-3 flex flex-col justify-between bg-slate-50">
                <div style={{ color: accent }} className="text-sm font-bold tracking-tight font-display">
                  {product.brand}
                </div>
                <div className="text-[10px] text-slate-600 leading-tight mt-2">
                  {product.manufacturer.companyName}
                </div>
              </div>
              <div className="col-span-6 p-3 flex flex-col justify-center text-center">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Ficha Técnica de Produto
                </div>
                <h1 className="text-base font-bold text-slate-950 leading-snug mt-0.5">
                  {product.name}
                </h1>
                <div className="text-xs text-slate-600 mt-0.5">{CATEGORY_LABELS[product.category]}</div>
              </div>
              <div className="col-span-3 text-[10.5px] font-mono tabular-nums divide-y divide-slate-900">
                <div className="px-2.5 py-1 flex justify-between">
                  <span className="text-slate-500">Código:</span>
                  <span className="font-semibold">{product.sku}</span>
                </div>
                <div className="px-2.5 py-1 flex justify-between">
                  <span className="text-slate-500">Revisão:</span>
                  <span className="font-semibold">Rev. {product.revision}</span>
                </div>
                <div className="px-2.5 py-1 flex justify-between">
                  <span className="text-slate-500">Emissão:</span>
                  <span>{product.issueDate}</span>
                </div>
                <div className="px-2.5 py-1 flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold">{STATUS_LABELS[product.status]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 01. Identificação e Descrição Técnica */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              01. Identificação e Caracterização Geral
            </h2>
            <p className="text-xs leading-relaxed text-slate-800">{product.description}</p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 pt-1 text-xs border border-slate-200 bg-slate-50/60 p-3">
              <div>
                <div className="text-[10px] text-slate-500">Marca Comercial</div>
                <div className="font-semibold text-slate-900">{product.brand}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Código EAN-13 (GTIN)</div>
                <div className="font-mono font-medium text-slate-900 tabular-nums">{validEan}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Conteúdo / Peso Líquido</div>
                <div className="font-medium text-slate-900">{product.netWeightDisplay}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Classificação Fiscal (NCM)</div>
                <div className="font-mono text-slate-900 tabular-nums">{product.logistics.ncmCode}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Prazo de Validade</div>
                <div className="text-slate-900">{product.logistics.shelfLife}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Enquadramento Legal</div>
                <div className="text-slate-900 truncate" title={product.manufacturer.msRegistration}>
                  {product.manufacturer.msRegistration || 'Conforme norma vigente'}
                </div>
              </div>
            </div>
          </section>

          {/* 02. Composição / Formulação */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              02. Composição e Declaração de Rotulagem
            </h2>
            {product.ingredientsText && (
              <div className="text-xs leading-relaxed text-slate-800">
                <span className="font-semibold text-slate-950">Lista declarada: </span>
                {product.ingredientsText}
              </div>
            )}
            {product.ingredientsList.length > 0 && (
              <table className="w-full text-xs border border-slate-300 border-collapse tabular-nums">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                    <th className="px-3 py-1.5 font-semibold">Componente / Matéria-Prima</th>
                    <th className="px-3 py-1.5 font-semibold">Função / Registro CAS / Detalhe</th>
                    <th className="px-3 py-1.5 font-semibold text-right w-24">Teor (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.ingredientsList.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-1.5 font-medium text-slate-900">{item.name}</td>
                      <td className="px-3 py-1.5 text-slate-700">{item.functionOrDetail}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-900">{item.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {(product.allergensText || product.glutenDeclaration !== 'N/A' || product.lactoseDeclaration !== 'N/A') && (
              <div className="text-xs font-semibold text-slate-950 border border-slate-400 bg-slate-50 px-3 py-2">
                {product.allergensText}{' '}
                {product.glutenDeclaration !== 'N/A' && `· ${product.glutenDeclaration}`}{' '}
                {product.lactoseDeclaration !== 'N/A' && `· ${product.lactoseDeclaration}`}
              </div>
            )}
          </section>

          {/* 03. Especificações Técnicas Físico-Químicas e Microbiológicas */}
          {product.technicalParams.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                03. Parâmetros de Controle de Qualidade e Especificações
              </h2>
              <table className="w-full text-xs border border-slate-300 border-collapse tabular-nums">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-left border-b border-slate-300">
                    <th className="px-3 py-1.5 font-semibold">Parâmetro Analítico</th>
                    <th className="px-3 py-1.5 font-semibold">Método / Norma</th>
                    <th className="px-3 py-1.5 font-semibold text-right">Especificação</th>
                    <th className="px-3 py-1.5 font-semibold text-right w-20">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {product.technicalParams.map((tp) => (
                    <tr key={tp.id}>
                      <td className="px-3 py-1.5 font-medium text-slate-900">{tp.name}</td>
                      <td className="px-3 py-1.5 text-slate-600">{tp.method}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium text-slate-900">
                        {tp.specification}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-600">{tp.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* 04. Bloco Regulatório Específico: Nutricional (ANVISA) ou Segurança Química (GHS) */}
          {product.nutrition.enabled && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  04. Perfil Nutricional (RDC 429 / IN 75 ANVISA)
                </h2>
                <AnvisaLupas alerts={lupaAlerts} compact />
              </div>
              <table className="w-full text-xs border border-slate-300 border-collapse tabular-nums">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="px-3 py-1.5 text-left font-semibold">
                      Nutriente (Porção de {product.nutrition.servingSize} {product.nutrition.servingUnit} — {product.nutrition.householdMeasure})
                    </th>
                    <th className="px-3 py-1.5 text-right font-semibold">100 {product.nutrition.servingUnit}</th>
                    <th className="px-3 py-1.5 text-right font-semibold">
                      Porção ({product.nutrition.servingSize} {product.nutrition.servingUnit})
                    </th>
                    <th className="px-3 py-1.5 text-right font-semibold w-20">%VD*</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {nutritionRows.map((row) => (
                    <tr key={row.key}>
                      <td className={`px-3 py-1 ${row.indent ? 'pl-6 text-slate-700' : 'font-medium text-slate-900'}`}>
                        {row.label} ({row.unit})
                      </td>
                      <td className="px-3 py-1 text-right font-mono">{row.per100}</td>
                      <td className="px-3 py-1 text-right font-mono">{row.perServing}</td>
                      <td className="px-3 py-1 text-right font-mono font-medium">{row.vdPercent || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {product.ghs.enabled && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                04. Segurança Química e Classificação GHS (ABNT NBR 14725)
              </h2>
              <div className="border border-slate-300 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Palavra de Advertência: </span>
                      <span className="font-bold text-red-700">{product.ghs.signalWord}</span>
                    </div>
                    {product.ghs.unNumber && (
                      <div>
                        <span className="font-semibold text-slate-700">Transporte: </span>
                        <span className="font-mono">
                          {product.ghs.unNumber} · {product.ghs.hazardClass}
                        </span>
                      </div>
                    )}
                    {product.ghs.ppeRequired && (
                      <div>
                        <span className="font-semibold text-slate-700">EPIs Recomendados: </span>
                        <span>{product.ghs.ppeRequired}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {product.ghs.pictograms.map((pic) => (
                      <GhsPictogramSvg key={pic} type={pic} size={46} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-[11px] leading-snug">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Frases de Perigo (H)</div>
                    <ul className="space-y-0.5 text-slate-700">
                      {product.ghs.hazardStatements.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Frases de Precaução (P)</div>
                    <ul className="space-y-0.5 text-slate-700">
                      {product.ghs.precautionStatements.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 05. Aplicação, Armazenamento e Logística */}
          <section className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              05. Aplicação, Armazenamento e Dados Logísticos
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 p-3 space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-900">Modo de Uso / Processo: </span>
                  <span className="text-slate-700">{product.usageInstructions}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Precauções: </span>
                  <span className="text-slate-700">{product.precautionsText}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Condições de Armazenamento: </span>
                  <span className="text-slate-700">{product.logistics.storageConditions}</span>
                </div>
              </div>
              <div className="border border-slate-200 p-3 space-y-1 text-xs tabular-nums">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Embalagem Primária:</span>
                  <span className="text-right font-medium text-slate-900 max-w-[60%]">
                    {product.logistics.primaryPackaging}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Embalagem Secundária:</span>
                  <span className="text-right text-slate-800 max-w-[60%]">{product.logistics.secondaryPackaging}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Peso Bruto / Dimensões:</span>
                  <span className="text-right font-mono text-slate-900">
                    {product.logistics.grossWeight} · {product.logistics.dimensionsMm}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Empilhamento Máx.:</span>
                  <span className="text-right text-slate-900">{product.logistics.stackingMax}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Origem:</span>
                  <span className="text-right text-slate-900">{product.logistics.origin}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer: Barcodes + Sign-off */}
          <footer className="pt-3 border-t border-slate-300 flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <Ean13Barcode value={product.ean13} width={140} height={46} />
              {product.showQrCode && (
                <QrCodeSvg value={`${product.sku}|${validEan}|REV${product.revision}`} size={46} />
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-6 text-center text-[11px] pt-4">
              <div className="border-t border-slate-400 pt-1">
                <div className="font-semibold text-slate-900">{product.manufacturer.technicalResponsible}</div>
                <div className="text-slate-500 font-mono text-[10px]">
                  Responsável Técnico · {product.manufacturer.professionalRegistry}
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <div className="font-semibold text-slate-900">Garantia da Qualidade</div>
                <div className="text-slate-500 font-mono text-[10px]">
                  Vigência: {product.issueDate} a {product.reviewDate}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
