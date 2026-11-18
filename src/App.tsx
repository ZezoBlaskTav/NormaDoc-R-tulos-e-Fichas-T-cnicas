import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Columns2,
  Download,
  FileText,
  Maximize2,
  Printer,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { DatasheetPreview } from './components/DatasheetPreview';
import { LabelPreview } from './components/LabelPreview';
import { ProductEditor } from './components/ProductEditor';
import { Sidebar } from './components/Sidebar';
import { INITIAL_PRODUCTS, createNewProduct, migrateProductDocument } from './data/presets';
import {
  CATEGORY_LABELS,
  LabelFormat,
  NutritionTableLayout,
  ProductCategory,
  ProductDocument,
} from './types/product';
import { evaluateCompliance } from './utils/compliance';

const STORAGE_KEY = 'normadoc_products_v1';

type PreviewDocType = 'rotulo' | 'ficha';
type WorkspaceMode = 'split' | 'preview';
type MobilePane = 'catalogo' | 'editor' | 'previa';

export default function App() {
  const [products, setProducts] = useState<ProductDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => migrateProductDocument(item));
        }
      }
    } catch {
      // Fallback to presets
    }
    return INITIAL_PRODUCTS;
  });

  const [selectedId, setSelectedId] = useState<string>(() => products[0]?.id || INITIAL_PRODUCTS[0].id);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocType>('rotulo');
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('100x150');
  const [zoom, setZoom] = useState<number>(0.9);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('split');
  const [mobilePane, setMobilePane] = useState<MobilePane>('editor');
  const [showCompliance, setShowCompliance] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage quota errors
    }
  }, [products]);

  const activeProduct = products.find((p) => p.id === selectedId) || products[0];

  const handleUpdateProduct = (updated: ProductDocument) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreateProduct = (category: ProductCategory) => {
    const next = createNewProduct(category);
    setProducts((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setMobilePane('editor');
  };

  const handleDuplicateProduct = (id: string) => {
    const source = products.find((p) => p.id === id);
    if (!source) return;
    const copy: ProductDocument = migrateProductDocument({
      ...JSON.parse(JSON.stringify(source)),
      id: `prod-${Date.now()}`,
      name: `${source.name} (Cópia)`,
      sku: `${source.sku}-C`,
      status: 'rascunho',
      revision: '01',
    });
    setProducts((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
  };

  const handleDeleteProduct = (id: string) => {
    if (products.length <= 1) return;
    const remaining = products.filter((p) => p.id !== id);
    setProducts(remaining);
    if (selectedId === id && remaining[0]) {
      setSelectedId(remaining[0].id);
    }
  };

  const handleImportJson = (doc: ProductDocument) => {
    const migrated = migrateProductDocument(doc);
    setProducts((prev) => [migrated, ...prev]);
    setSelectedId(migrated.id);
  };

  const handleResetDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setSelectedId(INITIAL_PRODUCTS[0].id);
  };

  const handleExportJson = () => {
    if (!activeProduct) return;
    const blob = new Blob([JSON.stringify(activeProduct, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProduct.sku.toLowerCase()}-${previewDoc}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const complianceChecks = activeProduct ? evaluateCompliance(activeProduct) : [];
  const passedCount = complianceChecks.filter((c) => c.passed).length;
  const allPassed = passedCount === complianceChecks.length;

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      {/* Top Bar */}
      <header className="no-print h-14 shrink-0 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-display text-base font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0">
            NormaDoc
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">
            /
          </span>
          {activeProduct && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 min-w-0 truncate">
              <span className="whitespace-nowrap">{CATEGORY_LABELS[activeProduct.category]}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-900 truncate">{activeProduct.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-600 tabular-nums whitespace-nowrap">
                {activeProduct.sku}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            {previewDoc === 'rotulo' ? 'Imprimir Rótulo' : 'Imprimir Ficha'}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Switcher */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-3 py-2 grid grid-cols-3 gap-1">
        {(
          [
            { id: 'catalogo', label: 'Catálogo' },
            { id: 'editor', label: 'Editor' },
            { id: 'previa', label: 'Prévia' },
          ] as { id: MobilePane; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobilePane(tab.id)}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              mobilePane === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Catalog Sidebar */}
        <div className={`${mobilePane === 'catalogo' ? 'flex w-full lg:w-auto' : 'hidden lg:flex'} h-full`}>
          <Sidebar
            products={products}
            selectedId={activeProduct.id}
            onSelect={(id) => {
              setSelectedId(id);
              setMobilePane('editor');
            }}
            onCreate={handleCreateProduct}
            onDuplicate={handleDuplicateProduct}
            onDelete={handleDeleteProduct}
            onImportJson={handleImportJson}
            onResetDefaults={handleResetDefaults}
          />
        </div>

        {/* Center Authoring Editor */}
        {workspaceMode === 'split' && (
          <main
            className={`${
              mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
            } flex-1 min-w-0 border-r border-slate-200 flex-col h-full`}
          >
            <ProductEditor
              product={activeProduct}
              labelFormat={labelFormat}
              onLabelFormatChange={setLabelFormat}
              onChange={handleUpdateProduct}
            />
          </main>
        )}

        {/* Right Live Preview Canvas */}
        <section
          className={`${
            mobilePane === 'previa' ? 'flex' : 'hidden lg:flex'
          } print-only-container ${
            workspaceMode === 'preview' ? 'flex-1' : 'w-full lg:w-[50%] xl:w-[48%]'
          } flex-col h-full bg-slate-100 min-w-0`}
        >
          {/* Preview Studio Toolbar */}
          <div className="no-print h-12 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-2 overflow-x-auto">
            {/* Document Type Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc('rotulo');
                  setZoom(0.95);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  previewDoc === 'rotulo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Rótulo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc('ficha');
                  setZoom(0.75);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  previewDoc === 'ficha' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Ficha Técnica
              </button>
            </div>

            {/* Label Size, Nutrition Layout Quick Switch & Zoom Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {previewDoc === 'rotulo' && (
                <>
                  <select
                    aria-label="Formato do rótulo"
                    value={labelFormat}
                    onChange={(e) => setLabelFormat(e.target.value as LabelFormat)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
                  >
                    <option value="100x150">100 × 150 mm</option>
                    <option value="100x70">100 × 70 mm</option>
                    <option value="140x80">140 × 80 mm</option>
                    <option value="custom">Personalizado</option>
                  </select>

                  {activeProduct.nutrition.enabled && (
                    <select
                      aria-label="Modelo da tabela nutricional"
                      title="Modelo da Tabela Nutricional ANVISA"
                      value={activeProduct.nutrition.tableLayout || 'vertical'}
                      onChange={(e) =>
                        handleUpdateProduct({
                          ...activeProduct,
                          nutrition: {
                            ...activeProduct.nutrition,
                            tableLayout: e.target.value as NutritionTableLayout,
                          },
                        })
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="vertical">Tab. Vertical</option>
                      <option value="horizontal">Tab. Horizontal</option>
                      <option value="vertical-quebrado">Tab. Quebrado</option>
                    </select>
                  )}
                </>
              )}

              <select
                aria-label="Escala de visualização"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono tabular-nums text-slate-700 focus:border-blue-700 focus:outline-none"
              >
                <option value={0.65}>65%</option>
                <option value={0.75}>75%</option>
                <option value={0.9}>90%</option>
                <option value={0.95}>95%</option>
                <option value={1}>100%</option>
                <option value={1.15}>115%</option>
              </select>

              <button
                type="button"
                onClick={() => setShowCompliance((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  allPassed
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                    : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {passedCount}/{complianceChecks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceMode((m) => (m === 'split' ? 'preview' : 'split'))}
                title={workspaceMode === 'split' ? 'Expandir visualização' : 'Voltar ao editor dividido'}
                className="hidden lg:inline-flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-700 hover:bg-slate-50"
              >
                {workspaceMode === 'split' ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Columns2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Regulatory Compliance Panel */}
          {showCompliance && (
            <div className="no-print bg-white border-b border-slate-200 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  Verificação de Conformidade Documental
                </span>
                <button
                  type="button"
                  onClick={() => setShowCompliance(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {complianceChecks.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-start gap-2 border border-slate-200 rounded-md p-2 text-xs"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{chk.label}</div>
                      <div className="text-[11px] text-slate-500">{chk.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Viewport */}
          <div className="flex-1 overflow-auto studio-scroll print-only-container">
            {previewDoc === 'rotulo' ? (
              <LabelPreview product={activeProduct} format={labelFormat} zoom={zoom} />
            ) : (
              <DatasheetPreview product={activeProduct} zoom={zoom} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
