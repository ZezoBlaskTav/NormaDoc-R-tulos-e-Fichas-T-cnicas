import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  ANIMAL_STAMP_LABELS,
  AnimalStampType,
  CATEGORY_LABELS,
  DEFAULT_ANIMAL_STAMP,
  DEFAULT_LABEL_DESIGN,
  FOOD_CLASSIFICATIONS,
  FoodClassificationSpec,
  GhsPictogramId,
  LabelFormat,
  LupaLayout,
  NutritionTableLayout,
  ProductCategory,
  ProductDocument,
} from '../types/product';
import { calculateEan13CheckDigit, normalizeEan13 } from '../utils/barcode';
import { computeLupaAlerts } from '../utils/nutrition';
import { AnimalInspectionStamp, AnvisaLupas, GHS_LABELS, GhsPictogramSvg } from './RegulatoryIcons';

interface GuidedWizardProps {
  product: ProductDocument;
  labelFormat: LabelFormat;
  onLabelFormatChange: (format: LabelFormat) => void;
  onChange: (updated: ProductDocument) => void;
  onApplyFoodClassification: (spec: FoodClassificationSpec) => void;
  onOpenFoodGuide: () => void;
  onOpenExpertMode: () => void;
}

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Tipo e classificação',
  'Nome, marca e código',
  'Inspeção, registro e perigos',
  'Ingredientes e alergênicos',
  'Nutrição e qualidade',
  'Uso, conservação e embalagem',
  'Fabricante, logo e visual',
];

const ACCENT_SWATCHES = [
  { label: 'Azul Técnico', value: '#1D4ED8' },
  { label: 'Marinho', value: '#1E3A5F' },
  { label: 'Verde Botânico', value: '#0F766E' },
  { label: 'Carmesim', value: '#991B1B' },
  { label: 'Grafite', value: '#1E293B' },
  { label: 'Âmbar', value: '#B45309' },
];

const ALL_GHS_PICTOGRAMS: GhsPictogramId[] = [
  'flammable',
  'corrosive',
  'exclamation',
  'skull',
  'health',
  'environment',
  'oxidizer',
];

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors';

const monoInputClass = `${inputClass} font-mono tabular-nums`;

export const GuidedWizard: React.FC<GuidedWizardProps> = ({
  product,
  labelFormat,
  onLabelFormatChange,
  onChange,
  onApplyFoodClassification,
  onOpenFoodGuide,
  onOpenExpertMode,
}) => {
  const [step, setStep] = useState<number>(1);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const design = product.labelDesign || DEFAULT_LABEL_DESIGN;
  const animalStamp = product.animalStamp || DEFAULT_ANIMAL_STAMP;
  const eanCheck = normalizeEan13(product.ean13);
  const lupaAlerts = computeLupaAlerts(product.nutrition);

  const updateField = <K extends keyof ProductDocument>(key: K, value: ProductDocument[K]) => {
    onChange({ ...product, [key]: value });
  };

  const updateDesign = <K extends keyof ProductDocument['labelDesign']>(
    key: K,
    value: ProductDocument['labelDesign'][K]
  ) => {
    onChange({ ...product, labelDesign: { ...design, [key]: value } });
  };

  const updateAnimalStamp = <K extends keyof ProductDocument['animalStamp']>(
    key: K,
    value: ProductDocument['animalStamp'][K]
  ) => {
    onChange({ ...product, animalStamp: { ...animalStamp, [key]: value } });
  };

  const updateNutrition = <K extends keyof ProductDocument['nutrition']>(
    key: K,
    value: ProductDocument['nutrition'][K]
  ) => {
    onChange({ ...product, nutrition: { ...product.nutrition, [key]: value } });
  };

  const updateGhs = <K extends keyof ProductDocument['ghs']>(key: K, value: ProductDocument['ghs'][K]) => {
    onChange({ ...product, ghs: { ...product.ghs, [key]: value } });
  };

  const updateManufacturer = (key: keyof ProductDocument['manufacturer'], value: string) => {
    onChange({ ...product, manufacturer: { ...product.manufacturer, [key]: value } });
  };

  const updateLogistics = (key: keyof ProductDocument['logistics'], value: string) => {
    onChange({ ...product, logistics: { ...product.logistics, [key]: value } });
  };

  const handleCategoryPick = (cat: ProductCategory) => {
    if (cat === product.category) return;
    onChange({
      ...product,
      category: cat,
      nutrition: { ...product.nutrition, enabled: cat === 'alimentos' },
      ghs: { ...product.ghs, enabled: cat === 'quimicos' },
      foodClassification: cat === 'alimentos' ? product.foodClassification || 'cereais_panificacao' : undefined,
    });
  };

  const handleFixEan = () => {
    const digits = product.ean13.replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    const check = calculateEan13CheckDigit(digits);
    updateField('ean13', `${digits}${check}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateDesign('logoDataUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleGhsPictogram = (pic: GhsPictogramId) => {
    const exists = product.ghs.pictograms.includes(pic);
    updateGhs(
      'pictograms',
      exists ? product.ghs.pictograms.filter((p) => p !== pic) : [...product.ghs.pictograms, pic]
    );
  };

  const appendAllergen = (word: string) => {
    const current = (product.allergensText || '').trim();
    if (!current) {
      updateField('allergensText', `ALÉRGICOS: CONTÉM ${word}.`);
      return;
    }
    if (current.toUpperCase().includes(word)) return;
    const cleaned = current.replace(/\.$/, '');
    updateField('allergensText', `${cleaned}, ${word}.`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Step Navigation Strip */}
      <div className="border-b border-slate-200 px-5 py-3 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 tabular-nums">
            Pergunta {step} de {TOTAL_STEPS} · {STEP_TITLES[step - 1]}
          </span>
          <button
            type="button"
            onClick={onOpenExpertMode}
            className="text-blue-700 hover:underline font-medium whitespace-nowrap"
          >
            Alternar para edição livre
          </button>
        </div>

        {/* Clickable step segments */}
        <div className="grid grid-cols-7 gap-1.5">
          {STEP_TITLES.map((title, idx) => {
            const num = idx + 1;
            const active = num === step;
            const done = num < step;
            return (
              <button
                key={num}
                type="button"
                title={`${num}. ${title}`}
                onClick={() => setStep(num)}
                className={`py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  active
                    ? 'bg-blue-700 text-white'
                    : done
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                }`}
              >
                0{num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                1. Que tipo de produto você está cadastrando?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A escolha ajusta automaticamente as normas exigidas no rótulo e na ficha técnica.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([cat, label]) => {
                const selected = product.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryPick(cat)}
                    className={`text-left p-3 border rounded-md transition-colors ${
                      selected
                        ? 'border-blue-700 bg-blue-50/50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{label}</span>
                      {selected && <Check className="w-4 h-4 text-blue-700" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {cat === 'alimentos' && 'ANVISA RDC 429 / 727, Lupas e Carimbos MAPA'}
                      {cat === 'cosmeticos' && 'ANVISA RDC 752, INCI e Prazo após Aberto (PAO)'}
                      {cat === 'quimicos' && 'ABNT NBR 14725, Pictogramas GHS, Frases H e P'}
                      {cat === 'industrial' && 'Especificações técnicas, processo e segurança'}
                    </div>
                  </button>
                );
              })}
            </div>

            {product.category === 'alimentos' && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Qual é a classificação dentro de Alimentos & Bebidas?
                    </h4>
                    <p className="text-xs text-slate-500">
                      Isso define se é sólido (g) ou líquido (ml), se exige carimbo animal ou aviso legal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFoodGuide}
                    className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0"
                  >
                    Ver guia completa
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {FOOD_CLASSIFICATIONS.map((spec) => {
                    const selected = product.foodClassification === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => onApplyFoodClassification(spec)}
                        className={`text-left px-3.5 py-2.5 border rounded-md transition-colors flex items-center justify-between gap-3 ${
                          selected
                            ? 'border-blue-700 bg-blue-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900">{spec.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {spec.group} · {spec.physicalState === 'liquido' ? 'Líquido (ml)' : 'Sólido (g)'}
                            {spec.requiresAnimalStamp ? ' · Exige Carimbo POA' : ''}
                          </div>
                        </div>
                        {selected && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                2. Como o produto se chama e qual o peso da embalagem?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esses dados aparecem em destaque na frente do rótulo e no cabeçalho da ficha técnica.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Qual o nome comercial do produto?
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Qual a marca ou linha?
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Qual o peso ou volume líquido?
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ex.: Peso Líq. 400 g"
                    value={product.netWeightDisplay}
                    onChange={(e) => updateField('netWeightDisplay', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Qual o subtítulo ou denominação de venda? (opcional)
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-800">
                    Dizeres de origem no rótulo (ex.: INDÚSTRIA BRASILEIRA)
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    {['INDÚSTRIA BRASILEIRA', 'FABRICADO NO BRASIL', 'PRODUTO IMPORTADO'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('industryOriginText', opt)}
                        className="text-blue-700 hover:underline"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  className={`${inputClass} uppercase font-medium`}
                  value={product.industryOriginText}
                  onChange={(e) => updateField('industryOriginText', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Código interno do produto (SKU)
                  </label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-800">Código de barras EAN-13</label>
                    <span className={`text-[11px] font-medium ${eanCheck.isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {eanCheck.isValid ? 'Válido' : 'Dígito pendente'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={13}
                      className={monoInputClass}
                      value={product.ean13}
                      onChange={(e) => updateField('ean13', e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      type="button"
                      onClick={handleFixEan}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Dígito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                3. Exige carimbo de inspeção, registro ou sinalização de perigo?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure selos oficiais (SIF, SIE, SIM) para origem animal ou pictogramas GHS para químicos.
              </p>
            </div>

            {product.category === 'alimentos' && (
              <div className="border border-slate-200 rounded-md p-4 space-y-3 bg-slate-50/40">
                <div className="text-xs font-semibold text-slate-900">
                  O produto é de origem animal (leite, carne, mel, ovos) e usa carimbo de inspeção?
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <div className="sm:col-span-2">
                      <select
                        className={inputClass}
                        value={animalStamp.type}
                        onChange={(e) => updateAnimalStamp('type', e.target.value as AnimalStampType)}
                      >
                        {(Object.entries(ANIMAL_STAMP_LABELS) as [AnimalStampType, string][]).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    {animalStamp.type !== 'nenhum' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Nº do Registro / Estabelecimento
                          </label>
                          <input
                            type="text"
                            className={monoInputClass}
                            value={animalStamp.registrationNumber}
                            onChange={(e) => updateAnimalStamp('registrationNumber', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Sigla / UF / País no carimbo
                          </label>
                          <input
                            type="text"
                            className={`${inputClass} uppercase`}
                            value={animalStamp.regionLabel}
                            onChange={(e) => updateAnimalStamp('regionLabel', e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {animalStamp.type !== 'nenhum' && (
                    <div className="p-2 bg-white border border-slate-200 rounded-md shrink-0">
                      <AnimalInspectionStamp stamp={animalStamp} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {product.category === 'alimentos' && product.foodClassification === 'bebidas_alcoolicas' && (
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Advertência obrigatória para bebida alcoólica
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.alcoholWarning || ''}
                  onChange={(e) => updateField('alcoholWarning', e.target.value)}
                />
              </div>
            )}

            {(product.category === 'quimicos' || product.category === 'industrial') && (
              <div className="border border-slate-200 rounded-md p-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.ghs.enabled}
                    onChange={(e) => updateGhs('enabled', e.target.checked)}
                  />
                  <span>Este produto possui classificação de perigo GHS (ABNT NBR 14725)?</span>
                </label>

                {product.ghs.enabled && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Palavra de Advertência</label>
                        <select
                          className={inputClass}
                          value={product.ghs.signalWord}
                          onChange={(e) =>
                            updateGhs('signalWord', e.target.value as ProductDocument['ghs']['signalWord'])
                          }
                        >
                          <option value="PERIGO">PERIGO</option>
                          <option value="ATENÇÃO">ATENÇÃO</option>
                          <option value="NENHUMA">Nenhuma</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Número ONU</label>
                        <input
                          type="text"
                          className={monoInputClass}
                          value={product.ghs.unNumber}
                          onChange={(e) => updateGhs('unNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Classe de Risco</label>
                        <input
                          type="text"
                          className={inputClass}
                          value={product.ghs.hazardClass}
                          onChange={(e) => updateGhs('hazardClass', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Quais pictogramas devem aparecer no rótulo?
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {ALL_GHS_PICTOGRAMS.map((pic) => {
                          const selected = product.ghs.pictograms.includes(pic);
                          return (
                            <button
                              key={pic}
                              type="button"
                              onClick={() => toggleGhsPictogram(pic)}
                              className={`p-1.5 border rounded flex flex-col items-center ${
                                selected ? 'border-red-600 bg-red-50/40' : 'border-slate-200'
                              }`}
                            >
                              <GhsPictogramSvg type={pic} size={30} />
                              <span className="text-[9.5px] text-center leading-tight mt-1">
                                {GHS_LABELS[pic]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Frases de Perigo (H) — uma por linha
                      </label>
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={product.ghs.hazardStatements.join('\n')}
                        onChange={(e) =>
                          updateGhs(
                            'hazardStatements',
                            e.target.value.split('\n').filter((l) => l.trim() !== '')
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {product.category === 'cosmeticos' && (
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Qual a validade após aberto (símbolo PAO)?
                </label>
                <input
                  type="text"
                  placeholder="Ex.: 12M"
                  className={monoInputClass}
                  value={product.paoMonths}
                  onChange={(e) => updateField('paoMonths', e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Qual o número de registro, notificação ou enquadramento legal (ANVISA / MAPA)?
              </label>
              <input
                type="text"
                className={inputClass}
                value={product.manufacturer.msRegistration}
                onChange={(e) => updateManufacturer('msRegistration', e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                4. Quais são os ingredientes (ou componentes) e alergênicos?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Informe em ordem decrescente de quantidade, exatamente como será impresso no rótulo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                {product.category === 'cosmeticos'
                  ? 'Composição completa (INCI)'
                  : product.category === 'alimentos'
                  ? 'Lista de ingredientes do produto'
                  : 'Composição química declarada'}
              </label>
              <textarea
                rows={3}
                className={inputClass}
                value={product.ingredientsText}
                onChange={(e) => updateField('ingredientsText', e.target.value)}
              />
            </div>

            {product.category === 'alimentos' && (
              <div className="space-y-3 border border-slate-200 rounded-md p-3.5 bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-800">
                      Há alergênicos a declarar (RDC 727)?
                    </label>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {['LEITE', 'TRIGO', 'AVEIA', 'SOJA', 'OVOS', 'CASTANHAS'].map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() => appendAllergen(al)}
                          className="text-blue-700 hover:underline"
                        >
                          +{al}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ex.: ALÉRGICOS: CONTÉM LEITE. PODE CONTER SOJA."
                    value={product.allergensText}
                    onChange={(e) => updateField('allergensText', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contém Glúten?</label>
                    <select
                      className={inputClass}
                      value={product.glutenDeclaration}
                      onChange={(e) =>
                        updateField('glutenDeclaration', e.target.value as ProductDocument['glutenDeclaration'])
                      }
                    >
                      <option value="NÃO CONTÉM GLÚTEN">NÃO CONTÉM GLÚTEN</option>
                      <option value="CONTÉM GLÚTEN">CONTÉM GLÚTEN</option>
                      <option value="N/A">Não aplicável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contém Lactose?</label>
                    <select
                      className={inputClass}
                      value={product.lactoseDeclaration}
                      onChange={(e) =>
                        updateField('lactoseDeclaration', e.target.value as ProductDocument['lactoseDeclaration'])
                      }
                    >
                      <option value="N/A">Não aplicável</option>
                      <option value="CONTÉM LACTOSE">CONTÉM LACTOSE</option>
                      <option value="ZERO LACTOSE">ZERO LACTOSE</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Formulation rows for Datasheet */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Percentual da formulação (para a Ficha Técnica)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateField('ingredientsList', [
                      ...product.ingredientsList,
                      { id: `ing-${Date.now()}`, name: '', functionOrDetail: '', percentage: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar linha
                </button>
              </div>
              {product.ingredientsList.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Componente"
                    className={`${inputClass} col-span-5 py-1.5`}
                    value={item.name}
                    onChange={(e) =>
                      updateField(
                        'ingredientsList',
                        product.ingredientsList.map((r) => (r.id === item.id ? { ...r, name: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Função / CAS"
                    className={`${inputClass} col-span-4 py-1.5`}
                    value={item.functionOrDetail}
                    onChange={(e) =>
                      updateField(
                        'ingredientsList',
                        product.ingredientsList.map((r) =>
                          r.id === item.id ? { ...r, functionOrDetail: e.target.value } : r
                        )
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="%"
                    className={`${monoInputClass} col-span-2 py-1.5 text-right`}
                    value={item.percentage}
                    onChange={(e) =>
                      updateField(
                        'ingredientsList',
                        product.ingredientsList.map((r) =>
                          r.id === item.id ? { ...r, percentage: e.target.value } : r
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'ingredientsList',
                        product.ingredientsList.filter((r) => r.id !== item.id)
                      )
                    }
                    className="col-span-1 flex justify-center text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                5. Valores nutricionais e parâmetros de qualidade
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                O sistema calcula automaticamente o %VD, as lupas frontais e monta a tabela oficial.
              </p>
            </div>

            {product.category === 'alimentos' && (
              <div className="space-y-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.nutrition.enabled}
                    onChange={(e) => updateNutrition('enabled', e.target.checked)}
                  />
                  <span>Este alimento exibe Tabela de Informação Nutricional</span>
                </label>

                {product.nutrition.enabled && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Base</label>
                        <select
                          className={inputClass}
                          value={product.nutrition.physicalState}
                          onChange={(e) => {
                            const st = e.target.value as 'solido' | 'liquido';
                            onChange({
                              ...product,
                              nutrition: {
                                ...product.nutrition,
                                physicalState: st,
                                servingUnit: st === 'liquido' ? 'ml' : 'g',
                              },
                            });
                          }}
                        >
                          <option value="solido">Sólido (100 g)</option>
                          <option value="liquido">Líquido (100 ml)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Porção ({product.nutrition.servingUnit})
                        </label>
                        <input
                          type="number"
                          className={monoInputClass}
                          value={product.nutrition.servingSize}
                          onChange={(e) => updateNutrition('servingSize', Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Medida caseira</label>
                        <input
                          type="text"
                          className={inputClass}
                          value={product.nutrition.householdMeasure}
                          onChange={(e) => updateNutrition('householdMeasure', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Porções/emb.</label>
                        <input
                          type="text"
                          className={inputClass}
                          value={product.nutrition.servingsPerPackage}
                          onChange={(e) => updateNutrition('servingsPerPackage', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 border border-slate-200 rounded-md p-3 bg-slate-50/50">
                      {[
                        { key: 'energyKcal100', label: 'Energia (kcal)' },
                        { key: 'carbs100', label: 'Carboidratos (g)' },
                        { key: 'totalSugars100', label: 'Açúc. totais (g)' },
                        { key: 'addedSugars100', label: 'Açúc. adic. (g)' },
                        { key: 'proteins100', label: 'Proteínas (g)' },
                        { key: 'totalFat100', label: 'Gord. totais (g)' },
                        { key: 'saturatedFat100', label: 'Gord. sat. (g)' },
                        { key: 'transFat100', label: 'Gord. trans (g)' },
                        { key: 'fiber100', label: 'Fibras (g)' },
                        { key: 'sodiumMg100', label: 'Sódio (mg)' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">{f.label}</label>
                          <input
                            type="number"
                            step="0.1"
                            className={`${monoInputClass} py-1.5`}
                            value={Number(product.nutrition[f.key as keyof typeof product.nutrition]) || 0}
                            onChange={(e) =>
                              updateNutrition(
                                f.key as keyof typeof product.nutrition,
                                Number(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="border border-slate-200 rounded-md p-3.5 space-y-3">
                      <div className="text-xs font-semibold text-slate-900">
                        Qual modelo de Informação Nutricional melhor se adapta ao seu rótulo?
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'vertical', label: '1. Vertical' },
                            { id: 'horizontal', label: '2. Horizontal' },
                            { id: 'vertical-quebrado', label: '3. Vertical Quebrado' },
                          ] as { id: NutritionTableLayout; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updateNutrition('tableLayout', opt.id)}
                            className={`px-2.5 py-2 border rounded-md text-xs font-medium text-center transition-colors ${
                              (product.nutrition.tableLayout || 'vertical') === opt.id
                                ? 'border-blue-700 bg-blue-50 text-blue-800'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {lupaAlerts.any && (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <AnvisaLupas alerts={lupaAlerts} layout={design.lupaLayout || 'horizontal'} />
                          <select
                            aria-label="Formato da lupa ANVISA"
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                            value={design.lupaLayout || 'horizontal'}
                            onChange={(e) => updateDesign('lupaLayout', e.target.value as LupaLayout)}
                          >
                            <option value="horizontal">Lupa Horizontal</option>
                            <option value="vertical">Lupa Vertical</option>
                            <option value="bloco">Lupa em Bloco / L</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quality Params */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Parâmetros analíticos / de qualidade (para a Ficha Técnica)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateField('technicalParams', [
                      ...product.technicalParams,
                      { id: `tp-${Date.now()}`, name: '', method: '', specification: '', unit: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar parâmetro
                </button>
              </div>
              {product.technicalParams.map((tp) => (
                <div key={tp.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Parâmetro"
                    className={`${inputClass} col-span-4 py-1.5`}
                    value={tp.name}
                    onChange={(e) =>
                      updateField(
                        'technicalParams',
                        product.technicalParams.map((r) => (r.id === tp.id ? { ...r, name: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Método"
                    className={`${inputClass} col-span-3 py-1.5`}
                    value={tp.method}
                    onChange={(e) =>
                      updateField(
                        'technicalParams',
                        product.technicalParams.map((r) => (r.id === tp.id ? { ...r, method: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Faixa"
                    className={`${monoInputClass} col-span-3 py-1.5 text-right`}
                    value={tp.specification}
                    onChange={(e) =>
                      updateField(
                        'technicalParams',
                        product.technicalParams.map((r) =>
                          r.id === tp.id ? { ...r, specification: e.target.value } : r
                        )
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Un."
                    className={`${monoInputClass} col-span-1 py-1.5 text-center px-1`}
                    value={tp.unit}
                    onChange={(e) =>
                      updateField(
                        'technicalParams',
                        product.technicalParams.map((r) => (r.id === tp.id ? { ...r, unit: e.target.value } : r))
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        'technicalParams',
                        product.technicalParams.filter((r) => r.id !== tp.id)
                      )
                    }
                    className="col-span-1 flex justify-center text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                6. Como usar, conservar, embalar e armazenar?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Orientações para o consumidor no rótulo e especificações logísticas para a ficha técnica.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Modo de uso ou preparo
              </label>
              <textarea
                rows={2}
                className={inputClass}
                value={product.usageInstructions}
                onChange={(e) => updateField('usageInstructions', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Cuidados de conservação e advertências
              </label>
              <textarea
                rows={2}
                className={inputClass}
                value={product.precautionsText}
                onChange={(e) => updateField('precautionsText', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Modelo de Lote (Rótulo)</label>
                <input
                  type="text"
                  className={monoInputClass}
                  value={product.batchFormat}
                  onChange={(e) => updateField('batchFormat', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Validade no Rótulo</label>
                <input
                  type="text"
                  className={monoInputClass}
                  value={product.validityDisplay}
                  onChange={(e) => updateField('validityDisplay', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">NCM Fiscal</label>
                <input
                  type="text"
                  className={monoInputClass}
                  value={product.logistics.ncmCode}
                  onChange={(e) => updateLogistics('ncmCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Embalagem Primária</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.logistics.primaryPackaging}
                  onChange={(e) => updateLogistics('primaryPackaging', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Armazenamento</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.logistics.storageConditions}
                  onChange={(e) => updateLogistics('storageConditions', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                7. Fabricante, logotipo e tamanho do rótulo
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Finalize com os dados legais da empresa, logotipo e dimensões da etiqueta.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social do Fabricante</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.manufacturer.companyName}
                  onChange={(e) => updateManufacturer('companyName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  className={monoInputClass}
                  value={product.manufacturer.cnpj}
                  onChange={(e) => updateManufacturer('cnpj', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">SAC (Telefone)</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.manufacturer.sacPhone}
                  onChange={(e) => updateManufacturer('sacPhone', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Endereço Fabril Completo</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.manufacturer.address}
                  onChange={(e) => updateManufacturer('address', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Responsável Técnico</label>
                <input
                  type="text"
                  className={inputClass}
                  value={product.manufacturer.technicalResponsible}
                  onChange={(e) => updateManufacturer('technicalResponsible', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Conselho (CRQ / CREA / CRF / CRMV)</label>
                <input
                  type="text"
                  className={monoInputClass}
                  value={product.manufacturer.professionalRegistry}
                  onChange={(e) => updateManufacturer('professionalRegistry', e.target.value)}
                />
              </div>
            </div>

            {/* Logo Upload & Label Format */}
            <div className="border border-slate-200 rounded-md p-3.5 space-y-3 bg-slate-50/40">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {design.logoDataUrl ? (
                    <img
                      src={design.logoDataUrl}
                      alt="Logo"
                      className="h-10 w-16 object-contain bg-white border border-slate-200 rounded p-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 w-16 border border-dashed border-slate-300 bg-white rounded flex items-center justify-center text-[10px] text-slate-400">
                      Logo
                    </div>
                  )}
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">Logotipo da Empresa</div>
                    <div className="text-slate-500">Altura atual: {design.logoHeightPx} px (mín. 24 px)</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {design.logoDataUrl ? 'Trocar' : 'Enviar logo'}
                  </button>
                  {design.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateDesign('logoDataUrl', '')}
                      className="p-1.5 text-slate-600 border border-slate-300 bg-white rounded-md hover:bg-slate-50"
                      title="Remover logo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {design.logoDataUrl && (
                <div>
                  <input
                    type="range"
                    min={24}
                    max={92}
                    step={2}
                    value={design.logoHeightPx}
                    onChange={(e) => updateDesign('logoHeightPx', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(
                  [
                    { id: '100x150', label: '100 × 150 mm' },
                    { id: '100x70', label: '100 × 70 mm' },
                    { id: '140x80', label: '140 × 80 mm' },
                    { id: 'custom', label: 'Personalizado' },
                  ] as { id: LabelFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => onLabelFormatChange(fmt.id)}
                    className={`px-2 py-1.5 text-xs font-medium border rounded-md ${
                      labelFormat === fmt.id
                        ? 'border-blue-700 bg-white text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {ACCENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => updateField('labelAccentColor', sw.value)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-[11px] bg-white ${
                      product.labelAccentColor.toLowerCase() === sw.value.toLowerCase()
                        ? 'border-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: sw.value }} />
                    {sw.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Wizard Pagination Bar */}
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/70 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Pergunta Anterior
        </button>

        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {step} / {TOTAL_STEPS}
        </span>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 text-white rounded-md text-xs font-medium hover:bg-blue-800"
          >
            Próxima Pergunta
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 text-white rounded-md text-xs font-medium hover:bg-emerald-800"
          >
            <Check className="w-3.5 h-3.5" />
            Revisar do Início
          </button>
        )}
      </div>
    </div>
  );
};
