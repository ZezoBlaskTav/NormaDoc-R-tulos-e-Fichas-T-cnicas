export type ProductCategory = 'alimentos' | 'cosmeticos' | 'quimicos' | 'industrial';

export type DocumentStatus = 'rascunho' | 'revisao' | 'aprovado';

export type LabelFormat = '100x150' | '100x70' | '140x80';

export type PhysicalState = 'solido' | 'liquido';

export type GhsPictogramId =
  | 'flammable'
  | 'corrosive'
  | 'exclamation'
  | 'skull'
  | 'health'
  | 'environment'
  | 'oxidizer';

export interface TechnicalParameter {
  id: string;
  name: string;
  method: string;
  specification: string;
  unit: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  functionOrDetail: string;
  percentage: string;
}

export interface NutritionProfile {
  enabled: boolean;
  physicalState: PhysicalState;
  servingSize: number;
  servingUnit: 'g' | 'ml';
  householdMeasure: string;
  servingsPerPackage: string;
  // Values per 100g or 100ml (ANVISA RDC 429)
  energyKcal100: number;
  carbs100: number;
  totalSugars100: number;
  addedSugars100: number;
  proteins100: number;
  totalFat100: number;
  saturatedFat100: number;
  transFat100: number;
  fiber100: number;
  sodiumMg100: number;
  // Optional manual override for lupas
  lupaMode: 'auto' | 'manual';
  manualLupaSugar: boolean;
  manualLupaSatFat: boolean;
  manualLupaSodium: boolean;
}

export interface GhsSafetyProfile {
  enabled: boolean;
  signalWord: 'PERIGO' | 'ATENÇÃO' | 'NENHUMA';
  pictograms: GhsPictogramId[];
  hazardStatements: string[]; // Frases H
  precautionStatements: string[]; // Frases P
  ppeRequired: string; // EPIs
  unNumber: string; // Número ONU
  hazardClass: string;
}

export interface PackagingLogistics {
  primaryPackaging: string;
  secondaryPackaging: string;
  grossWeight: string;
  dimensionsMm: string;
  stackingMax: string;
  storageConditions: string;
  shelfLife: string;
  ncmCode: string;
  origin: string;
}

export interface ManufacturerInfo {
  companyName: string;
  cnpj: string;
  address: string;
  sacPhone: string;
  sacEmail: string;
  website: string;
  technicalResponsible: string;
  professionalRegistry: string; // e.g., CRQ, CRF, CREA
  msRegistration: string; // Registro ANVISA / MAPA / Isento
}

export interface ProductDocument {
  id: string;
  name: string;
  brand: string;
  subtitle: string;
  sku: string;
  ean13: string;
  batchFormat: string;
  validityDisplay: string;
  netWeightDisplay: string;
  category: ProductCategory;
  status: DocumentStatus;
  revision: string;
  issueDate: string;
  reviewDate: string;
  labelAccentColor: string;
  description: string;
  usageInstructions: string;
  precautionsText: string;
  // Food specific declarations
  ingredientsText: string;
  allergensText: string;
  glutenDeclaration: 'CONTÉM GLÚTEN' | 'NÃO CONTÉM GLÚTEN' | 'N/A';
  lactoseDeclaration: 'CONTÉM LACTOSE' | 'ZERO LACTOSE' | 'N/A';
  // Cosmetic specific
  paoMonths: string; // e.g., "12M"
  // Structured tables
  ingredientsList: IngredientItem[];
  technicalParams: TechnicalParameter[];
  nutrition: NutritionProfile;
  ghs: GhsSafetyProfile;
  logistics: PackagingLogistics;
  manufacturer: ManufacturerInfo;
  // Regulatory & handling symbols on label
  showQrCode: boolean;
  showRecyclableSymbol: boolean;
  showKeepDrySymbol: boolean;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  alimentos: 'Alimentos & Bebidas',
  cosmeticos: 'Cosméticos & Higiene',
  quimicos: 'Químicos & Saneantes',
  industrial: 'Industrial & Manufatura',
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  rascunho: 'Rascunho',
  revisao: 'Em revisão',
  aprovado: 'Aprovado',
};
