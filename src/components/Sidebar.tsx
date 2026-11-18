import React, { useRef, useState } from 'react';
import { Copy, FolderUp, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { CATEGORY_LABELS, ProductCategory, ProductDocument, STATUS_LABELS } from '../types/product';

interface SidebarProps {
  products: ProductDocument[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (category: ProductCategory) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onImportJson: (doc: ProductDocument) => void;
  onResetDefaults: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  products,
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onImportJson,
  onResetDefaults,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'todos' | ProductCategory>('todos');
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter((p) => {
    const matchesCategory = categoryFilter === 'todos' || p.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.sku) {
          setImportError('Arquivo JSON incompatível.');
          return;
        }
        onImportJson({
          ...parsed,
          id: `prod-${Date.now()}`,
        });
      } catch {
        setImportError('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="no-print w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Catalog Header & Create Action */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Catálogo ({products.length})
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNewMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Produto
            </button>

            {newMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-30">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-500 border-b border-slate-100">
                  Selecione o modelo base
                </div>
                {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([cat, label]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onCreate(cat);
                      setNewMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, SKU ou marca..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-700 focus:outline-none"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-100 rounded-md text-[11px]">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'alimentos', label: 'Alim.' },
            { id: 'cosmeticos', label: 'Cosm.' },
            { id: 'quimicos', label: 'Quím.' },
            { id: 'industrial', label: 'Ind.' },
          ].map((item) => {
            const active = categoryFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryFilter(item.id as 'todos' | ProductCategory)}
                className={`py-1 rounded text-center font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto studio-scroll divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-slate-500">Nenhum produto encontrado para este filtro.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategoryFilter('todos');
              }}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={`group px-4 py-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
                onClick={() => onSelect(item.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold leading-snug truncate ${
                        isSelected ? 'text-blue-900' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums truncate">
                      <span className="font-mono text-slate-700">{item.sku}</span>
                      <span aria-hidden="true">·</span>
                      <span>Rev. {item.revision}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.status === 'aprovado'
                            ? 'text-emerald-700 font-medium'
                            : item.status === 'revisao'
                            ? 'text-amber-700 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row Quick Actions */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">{CATEGORY_LABELS[item.category]}</span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Duplicar produto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(item.id);
                      }}
                      className="p-1 hover:text-blue-700 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {products.length > 1 && (
                      <button
                        type="button"
                        title="Excluir produto"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-1 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Catalog Utilities */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 space-y-2">
        {importError && <div className="text-[11px] text-red-600">{importError}</div>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-slate-200 bg-white rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FolderUp className="w-3.5 h-3.5" />
            Importar JSON
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-slate-200 bg-white rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Base
          </button>
        </div>
      </div>
    </aside>
  );
};
