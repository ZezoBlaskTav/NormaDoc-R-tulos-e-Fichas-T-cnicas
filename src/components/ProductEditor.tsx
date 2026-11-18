import React, { useState } from 'react';
import { Plus, Trash2, Check, RefreshCw } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DocumentStatus,
  GhsPictogramId,
  ProductCategory,
  ProductDocument,
  STATUS_LABELS,
} from '../types/product';
import { calculateEan13CheckDigit, normalizeEan13 } from '../utils/barcode';
import { computeLupaAlerts } from '../utils/nutrition';
import { GHS_LABELS, GhsPictogramSvg } from './RegulatoryIcons';

type EditorTab = 'identificacao' | 'composicao' | 'parametros' | 'logistica';

interface ProductEditorProps {
  product: ProductDocument;
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

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors';

const monoInputClass = `${inputClass} font-mono tabular-nums`;

const labelClass = 'block text-xs font-medium text-slate-700 mb-1';

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, onChange }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('identificacao');

  const updateField = <K extends keyof ProductDocument>(key: K, value: ProductDocument[K]) => {
    onChange({ ...product, [key]: value });
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

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'identificacao', label: 'Identificação' },
    { id: 'composicao', label: 'Composição & Normas' },
    { id: 'parametros', label: 'Nutrição & Parâmetros' },
    { id: 'logistica', label: 'Logística & Embalagem' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Editor Sub-navigation Tabs */}
      <div className="border-b border-slate-200 px-5 pt-3 flex items-center gap-1 overflow-x-auto bg-slate-50/70">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
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

              {/* Accent Color Selector */}
              <div>
                <label className={labelClass}>Cor de Destaque do Rótulo</label>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {ACCENT_SWATCHES.map((sw) => {
                    const selected = product.labelAccentColor.toLowerCase() === sw.value.toLowerCase();
                    return (
                      <button
                        key={sw.value}
                        type="button"
                        onClick={() => updateField('labelAccentColor', sw.value)}
                        title={sw.label}
                        className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs transition-colors ${
                          selected
                            ? 'border-slate-900 bg-slate-100 font-medium text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-xs shrink-0"
                          style={{ backgroundColor: sw.value }}
                        />
                        <span>{sw.label}</span>
                      </button>
                    );
                  })}
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
                  <label className={labelClass}>Conselho de Classe (CREA / CRQ / CRF)</label>
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

        {activeTab === 'composicao' && (
          <>
            <section className="space-y-4">
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
                  <h3 className="text-sm font-semibold text-slate-900">Tabela Nutricional (ANVISA RDC 429 / IN 75)</h3>
                  <p className="text-xs text-slate-500">
                    Cálculo automático de porção, %VD e detecção das lupas frontais por 100g/ml.
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

                  {/* Lupa Mode & Detection Summary */}
                  <div className="border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">
                        Rotulagem Frontal (Lupa ANVISA IN 75)
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
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
                        value={product.nutrition.lupaMode}
                        onChange={(e) => updateNutrition('lupaMode', e.target.value as 'auto' | 'manual')}
                      >
                        <option value="auto">Detecção Automática</option>
                        <option value="manual">Seleção Manual</option>
                      </select>
                    </div>
                  </div>

                  {product.nutrition.lupaMode === 'manual' && (
                    <div className="flex flex-wrap gap-4 text-xs text-slate-700 px-1">
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
                  <label className={labelClass}>Origem</label>
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
    </div>
  );
};
