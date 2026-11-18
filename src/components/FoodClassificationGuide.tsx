import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import {
  FOOD_CLASSIFICATIONS,
  FoodClassificationId,
  FoodClassificationSpec,
  ProductDocument,
} from '../types/product';

interface FoodClassificationGuideProps {
  product: ProductDocument;
  onApplyClassification: (spec: FoodClassificationSpec) => void;
  onGoToWizard?: () => void;
}

const GROUPS: FoodClassificationSpec['group'][] = [
  'Origem Animal (MAPA / POA)',
  'Alimentos de Origem Vegetal / Processados',
  'Bebidas',
];

export const FoodClassificationGuide: React.FC<FoodClassificationGuideProps> = ({
  product,
  onApplyClassification,
  onGoToWizard,
}) => {
  const activeId: FoodClassificationId | undefined =
    product.category === 'alimentos' ? product.foodClassification : undefined;

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-6 bg-white">
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Guia Interna de Classificações — Alimentos & Bebidas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecione a classificação do produto para configurar automaticamente o órgão regulador, estado físico (g/ml), carimbo sanitário e exigências de rotulagem.
          </p>
        </div>
        {onGoToWizard && (
          <button
            type="button"
            onClick={onGoToWizard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50/60 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
          >
            Responder perguntas guiadas
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {GROUPS.map((group) => {
        const items = FOOD_CLASSIFICATIONS.filter((c) => c.group === group);
        return (
          <section key={group} className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              {group}
            </h4>
            <div className="space-y-2.5">
              {items.map((spec) => {
                const isSelected = activeId === spec.id;
                return (
                  <div
                    key={spec.id}
                    className={`border rounded-md p-3.5 transition-colors ${
                      isSelected
                        ? 'border-blue-700 bg-blue-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900">{spec.name}</div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>Órgão: {spec.authority}</span>
                          <span aria-hidden="true">·</span>
                          <span>Medida: {spec.physicalState === 'liquido' ? 'Líquido (100 ml)' : 'Sólido (100 g)'}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {spec.requiresAnimalStamp
                              ? 'Exige Carimbo POA (SIF/SIE/SIM)'
                              : 'Sem carimbo POA'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onApplyClassification(spec)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Classificação ativa
                          </>
                        ) : (
                          'Aplicar ao produto'
                        )}
                      </button>
                    </div>

                    <ul className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-700">
                      {spec.mandatoryNotes.map((note, idx) => (
                        <li key={idx} className="leading-snug">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
