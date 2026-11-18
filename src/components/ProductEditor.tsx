import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
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
  DocumentStatus,
  FOOD_CLASSIFICATIONS,
  FoodClassificationSpec,
  GhsPictogramId,
  LabelFormat,
  LupaLayout,
  NutritionTableLayout,
  ProductCategory,
  ProductDocument,
  STATUS_LABELS,
} from '../types/product';
import { calculateEan13CheckDigit, normalizeEan13 } from '../utils/barcode';
import { computeLupaAlerts } from '../utils/nutrition';
import { FoodClassificationGuide } from './FoodClassificationGuide';
import { GuidedWizard } from './GuidedWizard';
import { AnimalInspectionStamp, AnvisaLupas, GHS_LABELS, GhsPictogramSvg } from './RegulatoryIcons';

type EditorTab = 'identificacao' | 'diagramacao' | 'composicao' | 'parametros' | 'logistica';
type AuthoringMode = 'perguntas' | 'completo' | 'guia-alimentos';

interface ProductEditorProps {
  product: ProductDocument;
  labelFormat: LabelFormat;
  onLabelFormatChange: (format: LabelFormat) => void;
  onChange: (updated: ProductDocument) => void;
}

const ACCENT_SWATCHES = [
  { label: 'Azul Técnico', value: '#1D4ED8' },
  { label: 'Marinho Industrial', value: '#1E3A5F' },
  { label: 'Verde Botânico', value: '#0F766E' },
  { label: 'Carmesim Segurança', value: '#991B1B' },
  { label: 'Grafite Neutro', value: '#1E293B' },
  { label: 'Âmbar Alimentício', value: '#B45309' },
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

const SECTION_LABELS: Record<'lupa' | 'composicao' | 'nutricao' | 'ghs', string> = {
  lupa: 'Lupa Frontal ANVISA (Alto em)',
  composicao: 'Ingredientes, Alergênicos e Modo de Uso',
  nutricao: 'Tabela de Informação Nutricional',
  ghs: 'Bloco de Segurança Química (GHS)',
};

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors';

const monoInputClass = `${inputClass} font-mono tabular-nums`;

const labelClass = 'block text-xs font-medium text-slate-700 mb-1';

export const ProductEditor: React.FC<ProductEditorProps> = ({
  product,
  labelFormat,
  onLabelFormatChange,
  onChange,
}) => {
  const [authoringMode, setAuthoringMode] = useState<AuthoringMode>('perguntas');
  const [activeTab, setActiveTab] = useState<EditorTab>('identificacao');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const design = product.labelDesign || DEFAULT_LABEL_DESIGN;
  const animalStamp = product.animalStamp || DEFAULT_ANIMAL_STAMP;

  const applyFoodClassification = (spec: FoodClassificationSpec) => {
    const currentStamp = product.animalStamp || DEFAULT_ANIMAL_STAMP;
    const nextStampType = spec.requiresAnimalStamp
      ? currentStamp.type !== 'nenhum'
        ? currentStamp.type
        : spec.defaultStamp
      : 'nenhum';

    onChange({
      ...product,
      category: 'alimentos',
      foodClassification: spec.id,
      alcoholWarning: spec.defaultAlcoholWarning || '',
      allergensText:
        !product.allergensText.trim() && spec.defaultAllergensHint
          ? spec.defaultAllergensHint
          : product.allergensText,
      nutrition: {
        ...product.nutrition,
        enabled: spec.requiresNutrition,
        physicalState: spec.physicalState,
        servingUnit: spec.physicalState === 'liquido' ? 'ml' : 'g',
      },
      ghs: {
        ...product.ghs,
        enabled: false,
      },
      animalStamp: {
        ...currentStamp,
        type: nextStampType,
      },
    });
  };

  const updateField = <K extends keyof ProductDocument>(key: K, value: ProductDocument[K]) => {
    onChange({ ...product, [key]: value });
  };

  const updateDesign = <K extends keyof ProductDocument['labelDesign']>(
    key: K,
    value: ProductDocument['labelDesign'][K]
  ) => {
    onChange({
      ...product,
      labelDesign: { ...design, [key]: value },
    });
  };

  const updateAnimalStamp = <K extends keyof ProductDocument['animalStamp']>(
    key: K,
    value: ProductDocument['animalStamp'][K]
  ) => {
    onChange({
      ...product,
      animalStamp: { ...animalStamp, [key]: value },
    });
  };

  const updateManufacturer = (key: keyof ProductDocument['manufacturer'], value: string) => {
    onChange({
      ...product,
      manufacturer: { ...product.manufacturer, [key]: value },
    });
  };

  const updateLogistics = (key: keyof ProductDocument['logistics'], value: string) => {
    onChange({
      ...product,
      logistics: { ...product.logistics, [key]: value },
    });
  };

  const updateNutrition = <K extends keyof ProductDocument['nutrition']>(
    key: K,
    value: ProductDocument['nutrition'][K]
  ) => {
    onChange({
      ...product,
      nutrition: { ...product.nutrition, [key]: value },
    });
  };

  const updateGhs = <K extends keyof ProductDocument['ghs']>(key: K, value: ProductDocument['ghs'][K]) => {
    onChange({
      ...product,
      ghs: { ...product.ghs, [key]: value },
    });
  };

  const eanCheck = normalizeEan13(product.ean13);
  const lupaAlerts = computeLupaAlerts(product.nutrition);

  const handleFixEanCheckDigit = () => {
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

  const moveSection = (index: number, direction: -1 | 1) => {
    const order = [...(design.sectionOrder || ['lupa', 'composicao', 'nutricao', 'ghs'])];
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const temp = order[index];
    order[index] = order[target];
    order[target] = temp;
    updateDesign('sectionOrder', order);
  };

  const toggleGhsPictogram = (pic: GhsPictogramId) => {
    const exists = product.ghs.pictograms.includes(pic);
    updateGhs(
      'pictograms',
      exists ? product.ghs.pictograms.filter((p) => p !== pic) : [...product.ghs.pictograms, pic]
    );
  };

  const addIngredientRow = () => {
    updateField('ingredientsList', [
      ...product.ingredientsList,
      { id: `ing-${Date.now()}`, name: '', functionOrDetail: '', percentage: '' },
    ]);
  };

  const updateIngredientRow = (id: string, field: 'name' | 'functionOrDetail' | 'percentage', value: string) => {
    updateField(
      'ingredientsList',
      product.ingredientsList.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeIngredientRow = (id: string) => {
    updateField(
      'ingredientsList',
      product.ingredientsList.filter((row) => row.id !== id)
    );
  };

  const addTechParam = () => {
    updateField('technicalParams', [
      ...product.technicalParams,
      { id: `tp-${Date.now()}`, name: '', method: '', specification: '', unit: '' },
    ]);
  };

  const updateTechParam = (
    id: string,
    field: 'name' | 'method' | 'specification' | 'unit',
    value: string
  ) => {
    updateField(
      'technicalParams',
      product.technicalParams.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeTechParam = (id: string) => {
    updateField(
      'technicalParams',
      product.technicalParams.filter((row) => row.id !== id)
    );
  };

  const recommendedNutritionLayout: NutritionTableLayout =
    labelFormat === '100x70' || labelFormat === '140x80' ? 'horizontal' : 'vertical';

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'identificacao', label: 'Identificação' },
    { id: 'diagramacao', label: 'Diagramação & Logo' },
    { id: 'composicao', label: 'Composição & Selos' },
    { id: 'parametros', label: 'Nutrição & Parâmetros' },
    { id: 'logistica', label: 'Logística & Embalagem' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Authoring Mode Switcher (Questions / Complete Editor / Foods & Beverages Internal Guide) */}
      <div className="border-b border-slate-200 px-4 py-2.5 bg-white flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
          <button
            type="button"
            onClick={() => setAuthoringMode('perguntas')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              authoringMode === 'perguntas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Modo Perguntas
          </button>
          <button
            type="button"
            onClick={() => setAuthoringMode('completo')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              authoringMode === 'completo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Edição Completa
          </button>
          <button
            type="button"
            onClick={() => setAuthoringMode('guia-alimentos')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              authoringMode === 'guia-alimentos'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alimentos & Bebidas
          </button>
        </div>

        {product.category === 'alimentos' && product.foodClassification && (
          <span className="hidden xl:inline text-[11px] text-slate-500 truncate max-w-[200px]">
            {FOOD_CLASSIFICATIONS.find((c) => c.id === product.foodClassification)?.name.split(' (')[0]}
          </span>
        )}
      </div>

      {authoringMode === 'perguntas' && (
        <GuidedWizard
          product={product}
          labelFormat={labelFormat}
          onLabelFormatChange={onLabelFormatChange}
          onChange={onChange}
          onApplyFoodClassification={applyFoodClassification}
          onOpenFoodGuide={() => setAuthoringMode('guia-alimentos')}
          onOpenExpertMode={() => setAuthoringMode('completo')}
        />
      )}

      {authoringMode === 'guia-alimentos' && (
        <FoodClassificationGuide
          product={product}
          onApplyClassification={(spec) => {
            applyFoodClassification(spec);
          }}
          onGoToWizard={() => setAuthoringMode('perguntas')}
        />
      )}

      {authoringMode === 'completo' && (
        <>
          {/* Editor Sub-navigation Tabs */}
          <div className="border-b border-slate-200 px-4 pt-2 flex items-center gap-1 overflow-x-auto bg-slate-50/70">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-700 text-blue-800 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Editor Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-6 space-y-6">
        {activeTab === 'identificacao' && (
          <>
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Dados Principais do Produto</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informações exibidas no cabeçalho do rótulo e no controle da ficha técnica.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nome Comercial do Produto</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Marca / Linha</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Categoria Regulatória</label>
                  <select
                    className={inputClass}
                    value={product.category}
                    onChange={(e) => updateField('category', e.target.value as ProductCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Subtítulo / Denominação de Venda</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.subtitle}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      Dizeres Obrigatórios de Origem (Rótulo)
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
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
                    placeholder="Ex.: INDÚSTRIA BRASILEIRA"
                    value={product.industryOriginText}
                    onChange={(e) => updateField('industryOriginText', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Código Interno (SKU)</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">Código de Barras EAN-13</label>
                    <span
                      className={`text-[11px] font-medium ${
                        eanCheck.isValid ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {eanCheck.isValid ? 'Dígito válido' : 'Dígito verificador incorreto'}
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
                      onClick={handleFixEanCheckDigit}
                      title="Calcular 13º dígito verificador automaticamente"
                      className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Dígito
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Conteúdo / Peso Líquido</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.netWeightDisplay}
                    onChange={(e) => updateField('netWeightDisplay', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Status do Documento</label>
                  <select
                    className={inputClass}
                    value={product.status}
                    onChange={(e) => updateField('status', e.target.value as DocumentStatus)}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Modelo de Lote (Rótulo)</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.batchFormat}
                    onChange={(e) => updateField('batchFormat', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Validade Impressa (Rótulo)</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.validityDisplay}
                    onChange={(e) => updateField('validityDisplay', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Revisão da Ficha</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.revision}
                    onChange={(e) => updateField('revision', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Data de Emissão</label>
                  <input
                    type="date"
                    className={monoInputClass}
                    value={product.issueDate}
                    onChange={(e) => updateField('issueDate', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Manufacturer & Legal Info */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Fabricante e Responsabilidade Técnica</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Razão Social do Fabricante</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.manufacturer.companyName}
                    onChange={(e) => updateManufacturer('companyName', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.manufacturer.cnpj}
                    onChange={(e) => updateManufacturer('cnpj', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone / SAC</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.manufacturer.sacPhone}
                    onChange={(e) => updateManufacturer('sacPhone', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Endereço Fabril Completo</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.manufacturer.address}
                    onChange={(e) => updateManufacturer('address', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>E-mail Técnico / SAC</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={product.manufacturer.sacEmail}
                    onChange={(e) => updateManufacturer('sacEmail', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Responsável Técnico</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.manufacturer.technicalResponsible}
                    onChange={(e) => updateManufacturer('technicalResponsible', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Conselho de Classe (CREA / CRQ / CRF / CRMV)</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.manufacturer.professionalRegistry}
                    onChange={(e) => updateManufacturer('professionalRegistry', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Registro / Notificação Legal</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.manufacturer.msRegistration}
                    onChange={(e) => updateManufacturer('msRegistration', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'diagramacao' && (
          <>
            {/* Logo Upload & Placement */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Logotipo da Empresa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Insira o logotipo oficial em PNG, JPG ou SVG para exibição no rótulo e na ficha técnica.
                </p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {design.logoDataUrl ? (
                    <img
                      src={design.logoDataUrl}
                      alt="Logo carregado"
                      className="h-12 w-20 object-contain bg-white border border-slate-200 rounded p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-12 w-20 border border-dashed border-slate-300 bg-white rounded flex items-center justify-center text-[11px] text-slate-400">
                      Sem logo
                    </div>
                  )}
                  <div className="text-xs">
                    <div className="font-medium text-slate-900">
                      {design.logoDataUrl ? 'Logotipo ativo no documento' : 'Nenhum logotipo enviado'}
                    </div>
                    <div className="text-slate-500">Tamanho mínimo: 24 px para legibilidade</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 whitespace-nowrap"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {design.logoDataUrl ? 'Trocar logo' : 'Carregar logo'}
                  </button>
                  {design.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateDesign('logoDataUrl', '')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Altura do Logo</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {design.logoHeightPx} px (mín. 24 px)
                    </span>
                  </div>
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
                <div>
                  <label className={labelClass}>Posição no Cabeçalho</label>
                  <select
                    className={inputClass}
                    value={design.logoPosition}
                    onChange={(e) =>
                      updateDesign('logoPosition', e.target.value as 'left' | 'right' | 'top-center')
                    }
                  >
                    <option value="left">Esquerda do título</option>
                    <option value="right">Direita (acima do peso)</option>
                    <option value="top-center">Centralizado no topo</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Label Canvas Size & Header Style */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Dimensões do Rótulo e Estilo Visual</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha um formato padrão ou defina largura e altura personalizadas em milímetros.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    className={`px-3 py-2 text-xs font-medium border rounded-md transition-colors ${
                      labelFormat === fmt.id
                        ? 'border-blue-700 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {labelFormat === 'custom' && (
                <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-md p-3.5 bg-slate-50/50">
                  <div>
                    <label className={labelClass}>Largura (mm · mín. 55)</label>
                    <input
                      type="number"
                      min={55}
                      max={210}
                      className={monoInputClass}
                      value={design.customWidthMm}
                      onChange={(e) =>
                        updateDesign('customWidthMm', Math.max(55, Math.min(210, Number(e.target.value) || 55)))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Altura Mínima (mm · mín. 40)</label>
                    <input
                      type="number"
                      min={40}
                      max={297}
                      className={monoInputClass}
                      value={design.customHeightMm}
                      onChange={(e) =>
                        updateDesign('customHeightMm', Math.max(40, Math.min(297, Number(e.target.value) || 40)))
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Cor de Destaque do Cabeçalho</label>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {ACCENT_SWATCHES.map((sw) => {
                    const selected = product.labelAccentColor.toLowerCase() === sw.value.toLowerCase();
                    return (
                      <button
                        key={sw.value}
                        type="button"
                        onClick={() => updateField('labelAccentColor', sw.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs transition-colors ${
                          selected
                            ? 'border-slate-900 bg-slate-100 font-medium text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: sw.value }} />
                        <span>{sw.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 text-xs text-slate-700 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showHeaderBanner}
                    onChange={(e) => updateDesign('showHeaderBanner', e.target.checked)}
                  />
                  <span>Faixa colorida no cabeçalho</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showSubtitleOnLabel}
                    onChange={(e) => updateDesign('showSubtitleOnLabel', e.target.checked)}
                  />
                  <span>Exibir subtítulo no rótulo</span>
                </label>
              </div>
            </section>

            {/* Section Size Controls respecting Legal Minimums */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Tamanho das Seções (Respeitando os Mínimos Legais)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajuste a proporção de cada bloco sem violar os limites mínimos de legibilidade ANVISA e GS1.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Título do Produto</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {design.titleFontPx} px (mín. 12 px)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={24}
                    step={0.5}
                    value={design.titleFontPx}
                    onChange={(e) => updateDesign('titleFontPx', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Texto Geral / Ingredientes</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {design.bodyFontPx} px (mín. 8 px / 1 mm)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={12.5}
                    step={0.5}
                    value={design.bodyFontPx}
                    onChange={(e) => updateDesign('bodyFontPx', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Escala da Tabela Nutricional</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {Math.round(design.nutritionScale * 100)}% (mín. 78%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.78}
                    max={1.2}
                    step={0.02}
                    value={design.nutritionScale}
                    onChange={(e) => updateDesign('nutritionScale', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Escala da Lupa ANVISA</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {Math.round(design.lupaScale * 100)}% (mín. 75%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.3}
                    step={0.05}
                    value={design.lupaScale}
                    onChange={(e) => updateDesign('lupaScale', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Largura do Código de Barras EAN-13</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {design.barcodeWidthPx} px (mín. GS1: 112 px)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={112}
                    max={200}
                    step={4}
                    value={design.barcodeWidthPx}
                    onChange={(e) => updateDesign('barcodeWidthPx', Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </div>
              </div>
            </section>

            {/* Section Ordering */}
            <section className="space-y-3 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Ordem das Seções (Rótulo Vertical)</h3>
                <p className="text-xs text-slate-500">Reorganize a sequência vertical dos blocos no rótulo.</p>
              </div>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                {(design.sectionOrder || ['lupa', 'composicao', 'nutricao', 'ghs']).map((sec, idx, arr) => (
                  <div key={sec} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-medium text-slate-800">
                      {idx + 1}. {SECTION_LABELS[sec]}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, -1)}
                        className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === arr.length - 1}
                        onClick={() => moveSection(idx, 1)}
                        className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'composicao' && (
          <>
            {/* Animal Origin Inspection Stamp Section */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Carimbo Oficial para Produtos de Origem Animal (POA)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure o selo de inspeção sanitária (SIF, SIE, SIM, SISBI-POA ou Selo ARTE) conforme Decreto 9.013/2017.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start border border-slate-200 rounded-md p-3.5 bg-slate-50/40">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Tipo de Carimbo Sanitário</label>
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
                        <label className={labelClass}>Nº do Estabelecimento</label>
                        <input
                          type="text"
                          className={monoInputClass}
                          placeholder="Ex.: 3842"
                          value={animalStamp.registrationNumber}
                          onChange={(e) => updateAnimalStamp('registrationNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Sigla / Jurisdição (Inferior)</label>
                        <input
                          type="text"
                          className={`${inputClass} uppercase`}
                          placeholder="BRASIL / MG / SP"
                          value={animalStamp.regionLabel}
                          onChange={(e) => updateAnimalStamp('regionLabel', e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">Tamanho do Carimbo</span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {animalStamp.stampSizePx} px (mín. 44 px)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={44}
                          max={88}
                          step={2}
                          value={animalStamp.stampSizePx}
                          onChange={(e) => updateAnimalStamp('stampSizePx', Number(e.target.value))}
                          className="w-full accent-blue-700"
                        />
                      </div>
                    </>
                  )}
                </div>

                {animalStamp.type !== 'nenhum' && (
                  <div className="shrink-0 flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-md">
                    <AnimalInspectionStamp stamp={animalStamp} />
                    <span className="text-[10px] font-mono text-slate-500 mt-1">Prévia do Carimbo</span>
                  </div>
                )}
              </div>
            </section>

            {/* Ingredients & Allergens */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Declaração de Ingredientes e Alergênicos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Texto impresso no rótulo em ordem decrescente de proporção ou nomenclatura INCI / CAS.
                </p>
              </div>

              <div>
                <label className={labelClass}>Lista Declarada no Rótulo</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={product.ingredientsText}
                  onChange={(e) => updateField('ingredientsText', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Declaração de Alergênicos (ANVISA RDC 727)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ex.: ALÉRGICOS: CONTÉM CASTANHAS. PODE CONTER LEITE."
                    value={product.allergensText}
                    onChange={(e) => updateField('allergensText', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Declaração de Glúten</label>
                  <select
                    className={inputClass}
                    value={product.glutenDeclaration}
                    onChange={(e) =>
                      updateField('glutenDeclaration', e.target.value as ProductDocument['glutenDeclaration'])
                    }
                  >
                    <option value="N/A">Não aplicável</option>
                    <option value="NÃO CONTÉM GLÚTEN">NÃO CONTÉM GLÚTEN</option>
                    <option value="CONTÉM GLÚTEN">CONTÉM GLÚTEN</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Declaração de Lactose</label>
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
            </section>

            {/* Formula / Composition Table */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Tabela de Formulação (Ficha Técnica)</h3>
                  <p className="text-xs text-slate-500">Detalhamento qualitativo e quantitativo de componentes.</p>
                </div>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50/50 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar item
                </button>
              </div>

              <div className="space-y-2">
                {product.ingredientsList.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Componente"
                      className={`${inputClass} col-span-5`}
                      value={item.name}
                      onChange={(e) => updateIngredientRow(item.id, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Função / CAS"
                      className={`${inputClass} col-span-4`}
                      value={item.functionOrDetail}
                      onChange={(e) => updateIngredientRow(item.id, 'functionOrDetail', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="%"
                      className={`${monoInputClass} col-span-2 text-right`}
                      value={item.percentage}
                      onChange={(e) => updateIngredientRow(item.id, 'percentage', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(item.id)}
                      aria-label="Remover componente"
                      className="col-span-1 flex items-center justify-center p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* GHS Chemical Safety Section */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Classificação GHS (ABNT NBR 14725)</h3>
                  <p className="text-xs text-slate-500">Pictogramas de perigo, frases H/P e sinalização química.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.ghs.enabled}
                    onChange={(e) => updateGhs('enabled', e.target.checked)}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                  />
                  <span>Ativar bloco GHS</span>
                </label>
              </div>

              {product.ghs.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Palavra de Advertência</label>
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
                      <label className={labelClass}>Número ONU</label>
                      <input
                        type="text"
                        className={monoInputClass}
                        placeholder="Ex.: ONU 1760"
                        value={product.ghs.unNumber}
                        onChange={(e) => updateGhs('unNumber', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Classe de Risco</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Ex.: Classe 8"
                        value={product.ghs.hazardClass}
                        onChange={(e) => updateGhs('hazardClass', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Pictogramas de Perigo</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                      {ALL_GHS_PICTOGRAMS.map((pic) => {
                        const selected = product.ghs.pictograms.includes(pic);
                        return (
                          <button
                            key={pic}
                            type="button"
                            onClick={() => toggleGhsPictogram(pic)}
                            className={`relative flex flex-col items-center p-2 border rounded-md transition-colors ${
                              selected
                                ? 'border-red-600 bg-red-50/50 text-slate-900'
                                : 'border-slate-200 hover:border-slate-300 text-slate-500'
                            }`}
                          >
                            <GhsPictogramSvg type={pic} size={34} />
                            <span className="text-[10px] leading-tight text-center mt-1">{GHS_LABELS[pic]}</span>
                            {selected && (
                              <span className="absolute top-1 right-1 text-red-700">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Frases de Perigo (H) — uma por linha</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={product.ghs.hazardStatements.join('\n')}
                      onChange={(e) =>
                        updateGhs(
                          'hazardStatements',
                          e.target.value.split('\n').filter((line) => line.trim() !== '')
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Frases de Precaução (P) — uma por linha</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={product.ghs.precautionStatements.join('\n')}
                      onChange={(e) =>
                        updateGhs(
                          'precautionStatements',
                          e.target.value.split('\n').filter((line) => line.trim() !== '')
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>EPIs Recomendados</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={product.ghs.ppeRequired}
                      onChange={(e) => updateGhs('ppeRequired', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'parametros' && (
          <>
            {/* ANVISA Nutrition Profile */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Tabela Nutricional (ANVISA RDC 429 / IN 75)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cálculo automático de porção, %VD e lupas frontais oficiais por 100g/ml.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.nutrition.enabled}
                    onChange={(e) => updateNutrition('enabled', e.target.checked)}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                  />
                  <span>Incluir tabela nutricional</span>
                </label>
              </div>

              {product.nutrition.enabled && (
                <div className="space-y-4">
                  {/* Question prompting the user which ANVISA table format best adapts to the label */}
                  <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-2.5">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Qual modelo de Informação Nutricional melhor se adapta ao seu rótulo?
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Escolha entre os 3 modelos oficiais da IN 75/2020 da ANVISA conforme a geometria da embalagem.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(
                        [
                          {
                            id: 'vertical',
                            title: '1. Modelo Vertical',
                            desc: 'Padrão clássico em coluna única para rótulos verticais.',
                          },
                          {
                            id: 'horizontal',
                            title: '2. Modelo Horizontal',
                            desc: 'Título e porção à esquerda; ideal para rótulos largos.',
                          },
                          {
                            id: 'vertical-quebrado',
                            title: '3. Vertical Quebrado',
                            desc: 'Divide os nutrientes em 2 blocos para áreas baixas e largas.',
                          },
                        ] as { id: NutritionTableLayout; title: string; desc: string }[]
                      ).map((opt) => {
                        const selected = (product.nutrition.tableLayout || 'vertical') === opt.id;
                        const isRec = recommendedNutritionLayout === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updateNutrition('tableLayout', opt.id)}
                            className={`text-left p-2.5 border rounded-md transition-colors ${
                              selected
                                ? 'border-blue-700 bg-white ring-2 ring-blue-700/15'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            {/* Mini wireframe diagram matching ANVISA manual */}
                            <div className="h-8 mb-2 border border-slate-300 bg-slate-50 p-1 flex gap-1">
                              {opt.id === 'vertical' && (
                                <div className="w-full flex flex-col gap-0.5">
                                  <div className="h-1.5 bg-slate-800 w-full" />
                                  <div className="flex-1 grid grid-cols-4 gap-0.5">
                                    <div className="col-span-2 bg-slate-300" />
                                    <div className="bg-slate-200" />
                                    <div className="bg-slate-200" />
                                  </div>
                                </div>
                              )}
                              {opt.id === 'horizontal' && (
                                <div className="w-full flex gap-1">
                                  <div className="w-1/3 bg-slate-800/80" />
                                  <div className="flex-1 bg-slate-300" />
                                </div>
                              )}
                              {opt.id === 'vertical-quebrado' && (
                                <div className="w-full flex flex-col gap-0.5">
                                  <div className="h-1 bg-slate-800 w-full" />
                                  <div className="flex-1 grid grid-cols-2 gap-1">
                                    <div className="bg-slate-300" />
                                    <div className="bg-slate-300" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-slate-900">{opt.title}</div>
                            <div className="text-[10.5px] text-slate-500 leading-snug mt-0.5">{opt.desc}</div>
                            {isRec && (
                              <div className="text-[10px] font-medium text-blue-700 mt-1">
                                Recomendado para {labelFormat === 'custom' ? 'este formato' : labelFormat}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className={labelClass}>Estado Físico</label>
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
                        <option value="solido">Sólido (g)</option>
                        <option value="liquido">Líquido (ml)</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Porção ({product.nutrition.servingUnit})</label>
                      <input
                        type="number"
                        min={1}
                        className={monoInputClass}
                        value={product.nutrition.servingSize}
                        onChange={(e) => updateNutrition('servingSize', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Medida Caseira</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={product.nutrition.householdMeasure}
                        onChange={(e) => updateNutrition('householdMeasure', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Porções/Embalagem</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={product.nutrition.servingsPerPackage}
                        onChange={(e) => updateNutrition('servingsPerPackage', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Per 100g/ml inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border border-slate-200 p-3.5 bg-slate-50/50 rounded-md">
                    <div>
                      <label className={labelClass}>Energia (kcal/100)</label>
                      <input
                        type="number"
                        step="1"
                        className={monoInputClass}
                        value={product.nutrition.energyKcal100}
                        onChange={(e) => updateNutrition('energyKcal100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Carboidratos (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.carbs100}
                        onChange={(e) => updateNutrition('carbs100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Açúcares totais (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.totalSugars100}
                        onChange={(e) => updateNutrition('totalSugars100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Açúc. adicionados (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.addedSugars100}
                        onChange={(e) => updateNutrition('addedSugars100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Proteínas (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.proteins100}
                        onChange={(e) => updateNutrition('proteins100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Gord. totais (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.totalFat100}
                        onChange={(e) => updateNutrition('totalFat100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Gord. saturadas (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.saturatedFat100}
                        onChange={(e) => updateNutrition('saturatedFat100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Gord. trans (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.transFat100}
                        onChange={(e) => updateNutrition('transFat100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fibras (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={monoInputClass}
                        value={product.nutrition.fiber100}
                        onChange={(e) => updateNutrition('fiber100', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Sódio (mg/100)</label>
                      <input
                        type="number"
                        step="1"
                        className={monoInputClass}
                        value={product.nutrition.sodiumMg100}
                        onChange={(e) => updateNutrition('sodiumMg100', Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Lupa Mode, Layout & Live Preview */}
                  <div className="border border-slate-200 rounded-md p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs">
                        <div className="font-semibold text-slate-900">
                          Rotulagem Nutricional Frontal (Lupa ANVISA IN 75)
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          {lupaAlerts.any
                            ? `Alertas ativos: ${[
                                lupaAlerts.highAddedSugar && 'Açúcar Adicionado',
                                lupaAlerts.highSatFat && 'Gordura Saturada',
                                lupaAlerts.highSodium && 'Sódio',
                              ]
                                .filter(Boolean)
                                .join(' · ')}`
                            : 'Nenhum nutriente atingiu o limite para lupa frontal.'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          aria-label="Formato da lupa ANVISA"
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
                          value={design.lupaLayout || 'horizontal'}
                          onChange={(e) => updateDesign('lupaLayout', e.target.value as LupaLayout)}
                        >
                          <option value="horizontal">Lupa Horizontal</option>
                          <option value="vertical">Lupa Vertical</option>
                          <option value="bloco">Lupa em Bloco / L</option>
                        </select>
                        <select
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
                          value={product.nutrition.lupaMode}
                          onChange={(e) => updateNutrition('lupaMode', e.target.value as 'auto' | 'manual')}
                        >
                          <option value="auto">Automática</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                    </div>

                    {lupaAlerts.any && (
                      <div className="pt-1">
                        <AnvisaLupas alerts={lupaAlerts} layout={design.lupaLayout || 'horizontal'} scale={1} />
                      </div>
                    )}

                    {product.nutrition.lupaMode === 'manual' && (
                      <div className="flex flex-wrap gap-4 text-xs text-slate-700 pt-1">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.nutrition.manualLupaSugar}
                            onChange={(e) => updateNutrition('manualLupaSugar', e.target.checked)}
                          />
                          <span>Alto em Açúcar Adicionado</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.nutrition.manualLupaSatFat}
                            onChange={(e) => updateNutrition('manualLupaSatFat', e.target.checked)}
                          />
                          <span>Alto em Gordura Saturada</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.nutrition.manualLupaSodium}
                            onChange={(e) => updateNutrition('manualLupaSodium', e.target.checked)}
                          />
                          <span>Alto em Sódio</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Technical / Analytical Specifications Table */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Parâmetros Físico-Químicos e de Qualidade</h3>
                  <p className="text-xs text-slate-500">
                    Especificações analíticas exibidas na Ficha Técnica (e resumidas em rótulos técnicos).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTechParam}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50/50 rounded-md hover:bg-blue-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo parâmetro
                </button>
              </div>

              <div className="space-y-2">
                {product.technicalParams.map((tp) => (
                  <div key={tp.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Parâmetro"
                      className={`${inputClass} col-span-4`}
                      value={tp.name}
                      onChange={(e) => updateTechParam(tp.id, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Método / Norma"
                      className={`${inputClass} col-span-3`}
                      value={tp.method}
                      onChange={(e) => updateTechParam(tp.id, 'method', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Especificação"
                      className={`${monoInputClass} col-span-3 text-right`}
                      value={tp.specification}
                      onChange={(e) => updateTechParam(tp.id, 'specification', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Unid."
                      className={`${monoInputClass} col-span-1 text-center px-1`}
                      value={tp.unit}
                      onChange={(e) => updateTechParam(tp.id, 'unit', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTechParam(tp.id)}
                      aria-label="Remover parâmetro"
                      className="col-span-1 flex items-center justify-center p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'logistica' && (
          <>
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Descrição, Uso e Precauções</h3>
              </div>

              <div>
                <label className={labelClass}>Descrição Técnica Completa (Ficha Técnica)</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={product.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Modo de Uso / Instruções de Aplicação</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={product.usageInstructions}
                  onChange={(e) => updateField('usageInstructions', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Precauções e Advertências de Conservação</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={product.precautionsText}
                  onChange={(e) => updateField('precautionsText', e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Embalagem, Armazenamento e Logística</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Embalagem Primária</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.primaryPackaging}
                    onChange={(e) => updateLogistics('primaryPackaging', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Embalagem Secundária / Coletiva</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.secondaryPackaging}
                    onChange={(e) => updateLogistics('secondaryPackaging', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Peso Bruto</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.logistics.grossWeight}
                    onChange={(e) => updateLogistics('grossWeight', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Dimensões (L × A × P)</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.logistics.dimensionsMm}
                    onChange={(e) => updateLogistics('dimensionsMm', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Empilhamento Máximo</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.stackingMax}
                    onChange={(e) => updateLogistics('stackingMax', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Código NCM</label>
                  <input
                    type="text"
                    className={monoInputClass}
                    value={product.logistics.ncmCode}
                    onChange={(e) => updateLogistics('ncmCode', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Condições de Armazenamento</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.storageConditions}
                    onChange={(e) => updateLogistics('storageConditions', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Prazo de Validade (Ficha)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.shelfLife}
                    onChange={(e) => updateLogistics('shelfLife', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Origem (Ficha Técnica)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={product.logistics.origin}
                    onChange={(e) => updateLogistics('origin', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Label Symbols */}
            <section className="space-y-3 pt-2">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Simbologia Gráfica no Rótulo</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <label className="flex items-center gap-2 border border-slate-200 rounded-md p-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={product.showQrCode}
                    onChange={(e) => updateField('showQrCode', e.target.checked)}
                  />
                  <span>Exibir QR Code de rastreabilidade</span>
                </label>
                <label className="flex items-center gap-2 border border-slate-200 rounded-md p-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={product.showRecyclableSymbol}
                    onChange={(e) => updateField('showRecyclableSymbol', e.target.checked)}
                  />
                  <span>Símbolo de Embalagem Reciclável</span>
                </label>
                <label className="flex items-center gap-2 border border-slate-200 rounded-md p-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={product.showKeepDrySymbol}
                    onChange={(e) => updateField('showKeepDrySymbol', e.target.checked)}
                  />
                  <span>Símbolo Manter em Local Seco</span>
                </label>
                {product.category === 'cosmeticos' && (
                  <div className="flex items-center justify-between gap-2 border border-slate-200 rounded-md p-2.5">
                    <span>PAO (Após aberto):</span>
                    <input
                      type="text"
                      placeholder="12M"
                      className="w-16 rounded border border-slate-300 px-2 py-0.5 font-mono text-xs text-center"
                      value={product.paoMonths}
                      onChange={(e) => updateField('paoMonths', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
};
