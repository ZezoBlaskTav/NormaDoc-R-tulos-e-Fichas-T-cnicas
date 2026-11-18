import React from 'react';
import { NutritionProfile } from '../types/product';
import { computeNutritionRows } from '../utils/nutrition';

interface AnvisaNutritionTableProps {
  nutrition: NutritionProfile;
  scale?: number;
}

export const AnvisaNutritionTable: React.FC<AnvisaNutritionTableProps> = ({
  nutrition,
  scale = 1,
}) => {
  if (!nutrition.enabled) return null;

  const rows = computeNutritionRows(nutrition);
  const unit = nutrition.servingUnit || 'g';
  const servingLabel = `${nutrition.servingSize} ${unit}`;
  const ref100Label = `100 ${unit}`;
  const layout = nutrition.tableLayout || 'vertical';

  const getIndentClass = (key: string) => {
    if (key === 'addedSugars') return 'pl-4';
    if (key === 'totalSugars' || key === 'saturatedFat' || key === 'transFat') return 'pl-2';
    return '';
  };

  return (
    <div
      style={{
        zoom: scale !== 1 ? scale : undefined,
      }}
      className="bg-white text-black border border-black font-sans select-none w-full"
      aria-label="Tabela de Informação Nutricional ANVISA"
    >
      {layout === 'vertical' && (
        <div className="p-1.5">
          <div className="text-center font-bold text-[10px] tracking-tight leading-tight pb-1 border-b border-black">
            INFORMAÇÃO NUTRICIONAL
          </div>
          <div className="py-1 text-[8px] leading-snug">
            <div>Porções por embalagem: {nutrition.servingsPerPackage}</div>
            <div>
              Porção: {servingLabel} ({nutrition.householdMeasure})
            </div>
          </div>
          <div className="h-[3.5px] bg-black w-full" />
          <table className="w-full border-collapse text-[7.5px] tabular-nums leading-tight">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="text-left py-0.5 pr-1"></th>
                <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                  {ref100Label}
                </th>
                <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                  {servingLabel}
                </th>
                <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                  %VD*
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.key}
                  className={idx === rows.length - 1 ? 'border-b-[2px] border-black' : 'border-b border-black/75'}
                >
                  <td className={`py-[1.5px] pr-1 text-left ${getIndentClass(row.key)}`}>
                    {row.label} ({row.unit})
                  </td>
                  <td className="border-l border-black px-1 py-[1.5px] text-center">{row.per100}</td>
                  <td className="border-l border-black px-1 py-[1.5px] text-center">{row.perServing}</td>
                  <td className="border-l border-black px-1 py-[1.5px] text-center">{row.vdPercent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-1 text-[6.8px] leading-tight">
            *Percentual de valores diários fornecidos pela porção.
          </div>
        </div>
      )}

      {layout === 'horizontal' && (
        <div className="p-1.5 flex items-stretch gap-2">
          {/* Left Title & Serving Column */}
          <div className="w-[30%] shrink-0 flex flex-col">
            <div className="font-bold text-[9.5px] leading-[1.1] tracking-tight pb-1">
              INFORMAÇÃO
              <br />
              NUTRICIONAL
            </div>
            <div className="h-[3.5px] bg-black w-full mb-1.5" />
            <div className="text-[7.5px] leading-snug space-y-0.5">
              <div>Porções por emb.: {nutrition.servingsPerPackage}</div>
              <div>
                Porção: {servingLabel} ({nutrition.householdMeasure})
              </div>
            </div>
          </div>

          {/* Right Nutrient Table Column */}
          <div className="flex-1 min-w-0">
            <table className="w-full border-collapse text-[7.2px] tabular-nums leading-tight">
              <thead>
                <tr className="border-b border-black font-bold">
                  <th className="text-left py-0.5 pr-1"></th>
                  <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                    {ref100Label}
                  </th>
                  <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                    {servingLabel}
                  </th>
                  <th className="border-l border-black px-1 py-0.5 text-center whitespace-nowrap">
                    %VD*
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={idx === rows.length - 1 ? 'border-b-[2px] border-black' : 'border-b border-black/75'}
                  >
                    <td className={`py-[1.5px] pr-1 text-left ${getIndentClass(row.key)}`}>
                      {row.label} ({row.unit})
                    </td>
                    <td className="border-l border-black px-1 py-[1.5px] text-center">{row.per100}</td>
                    <td className="border-l border-black px-1 py-[1.5px] text-center">{row.perServing}</td>
                    <td className="border-l border-black px-1 py-[1.5px] text-center">{row.vdPercent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-1 text-[6.6px] leading-tight">
              *Percentual de valores diários fornecidos pela porção.
            </div>
          </div>
        </div>
      )}

      {layout === 'vertical-quebrado' && (
        <div className="p-1.5">
          <div className="text-center font-bold text-[10px] tracking-tight leading-tight pb-1 border-b border-black">
            INFORMAÇÃO NUTRICIONAL
          </div>
          <div className="py-0.5 text-[7.5px] leading-snug">
            Porções por embalagem: {nutrition.servingsPerPackage} • Porção: {servingLabel} (
            {nutrition.householdMeasure})
          </div>
          <div className="h-[3.5px] bg-black w-full mb-0.5" />

          <div className="grid grid-cols-2 gap-2 items-start">
            {/* Left Half (First 5 rows) */}
            <div>
              <table className="w-full border-collapse text-[7px] tabular-nums leading-tight">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="text-left py-0.5 pr-1"></th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      {ref100Label}
                    </th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      {servingLabel}
                    </th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      %VD*
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, idx) => (
                    <tr
                      key={row.key}
                      className={idx === 4 ? 'border-b-[2px] border-black' : 'border-b border-black/75'}
                    >
                      <td className={`py-[1.5px] pr-1 text-left ${getIndentClass(row.key)}`}>
                        {row.label} ({row.unit})
                      </td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.per100}</td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.perServing}</td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.vdPercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pt-1 text-[6.5px] leading-tight">
                *Percentual de valores diários fornecidos pela porção.
              </div>
            </div>

            {/* Right Half (Remaining 5 rows) */}
            <div>
              <table className="w-full border-collapse text-[7px] tabular-nums leading-tight">
                <thead>
                  <tr className="border-b border-black font-bold">
                    <th className="text-left py-0.5 pr-1"></th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      {ref100Label}
                    </th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      {servingLabel}
                    </th>
                    <th className="border-l border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                      %VD*
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(5).map((row, idx) => (
                    <tr
                      key={row.key}
                      className={idx === 4 ? 'border-b-[2px] border-black' : 'border-b border-black/75'}
                    >
                      <td className={`py-[1.5px] pr-1 text-left ${getIndentClass(row.key)}`}>
                        {row.label} ({row.unit})
                      </td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.per100}</td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.perServing}</td>
                      <td className="border-l border-black px-0.5 py-[1.5px] text-center">{row.vdPercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
