export type ProductCategory = 'alimentos' | 'cosmeticos' | 'quimicos' | 'industrial';

export type FoodClassificationId =
  | 'laticinios'
  | 'carnes_pescados'
  | 'ovos_mel'
  | 'cereais_panificacao'
  | 'doces_confeitaria'
  | 'molhos_conservas'
  | 'bebidas_nao_alcoolicas'
  | 'bebidas_alcoolicas';

export type DocumentStatus = 'rascunho' | 'revisao' | 'aprovado';

export type LabelFormat = '100x150' | '100x70' | '140x80' | 'custom';

export type PhysicalState = 'solido' | 'liquido';

export type NutritionTableLayout = 'vertical' | 'horizontal' | 'vertical-quebrado';

export type LupaLayout = 'horizontal' | 'vertical' | 'bloco';

export type AnimalStampType = 'nenhum' | 'SIF' | 'SIE' | 'SIM' | 'SISBI' | 'ARTE';

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
  tableLayout: NutritionTableLayout;
  servingSize: number;
  servingUnit: 'g' | 'ml';
  householdMeasure: string;
  servingsPerPackage: string;
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
  lupaMode: 'auto' | 'manual';
  manualLupaSugar: boolean;
  manualLupaSatFat: boolean;
  manualLupaSodium: boolean;
}

export interface GhsSafetyProfile {
  enabled: boolean;
  signalWord: 'PERIGO' | 'ATENÇÃO' | 'NENHUMA';
  pictograms: GhsPictogramId[];
  hazardStatements: string[];
  precautionStatements: string[];
  ppeRequired: string;
  unNumber: string;
  hazardClass: string;
}

export interface AnimalOriginStamp {
  type: AnimalStampType;
  registrationNumber: string;
  regionLabel: string;
  stampSizePx: number;
}

export interface LabelDesignSettings {
  logoDataUrl: string;
  logoHeightPx: number;
  logoPosition: 'left' | 'right' | 'top-center';
  customWidthMm: number;
  customHeightMm: number;
  titleFontPx: number;
  bodyFontPx: number;
  nutritionScale: number;
  lupaScale: number;
  lupaLayout: LupaLayout;
  barcodeWidthPx: number;
  showHeaderBanner: boolean;
  showSubtitleOnLabel: boolean;
  sectionOrder: ('lupa' | 'composicao' | 'nutricao' | 'ghs')[];
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
  professionalRegistry: string;
  msRegistration: string;
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
  industryOriginText: string;
  category: ProductCategory;
  foodClassification?: FoodClassificationId;
  alcoholWarning?: string;
  status: DocumentStatus;
  revision: string;
  issueDate: string;
  reviewDate: string;
  labelAccentColor: string;
  description: string;
  usageInstructions: string;
  precautionsText: string;
  ingredientsText: string;
  allergensText: string;
  glutenDeclaration: 'CONTÉM GLÚTEN' | 'NÃO CONTÉM GLÚTEN' | 'N/A';
  lactoseDeclaration: 'CONTÉM LACTOSE' | 'ZERO LACTOSE' | 'N/A';
  paoMonths: string;
  ingredientsList: IngredientItem[];
  technicalParams: TechnicalParameter[];
  nutrition: NutritionProfile;
  ghs: GhsSafetyProfile;
  animalStamp: AnimalOriginStamp;
  labelDesign: LabelDesignSettings;
  logistics: PackagingLogistics;
  manufacturer: ManufacturerInfo;
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

export interface FoodClassificationSpec {
  id: FoodClassificationId;
  name: string;
  group: 'Origem Animal (MAPA / POA)' | 'Alimentos de Origem Vegetal / Processados' | 'Bebidas';
  authority: string;
  physicalState: PhysicalState;
  requiresAnimalStamp: boolean;
  defaultStamp: AnimalStampType;
  requiresNutrition: boolean;
  mandatoryNotes: string[];
  defaultAllergensHint: string;
  defaultAlcoholWarning?: string;
}

export const FOOD_CLASSIFICATIONS: FoodClassificationSpec[] = [
  {
    id: 'laticinios',
    name: 'Laticínios e Derivados (Leite, Queijos, Doce de Leite, Iogurtes)',
    group: 'Origem Animal (MAPA / POA)',
    authority: 'MAPA (RIISPOA Decreto 9.013/2017) + ANVISA RDC 429 / 727',
    physicalState: 'solido',
    requiresAnimalStamp: true,
    defaultStamp: 'SIF',
    requiresNutrition: true,
    mandatoryNotes: [
      'Carimbo oficial obrigatório (SIF, SIE, SIM, SISBI ou Selo ARTE).',
      'Declaração obrigatória de lactose (CONTÉM LACTOSE / ZERO LACTOSE) quando aplicável.',
      'Destacar ALÉRGICOS: CONTÉM LEITE e DERIVADOS em caixa alta e negrito.',
    ],
    defaultAllergensHint: 'ALÉRGICOS: CONTÉM LEITE.',
  },
  {
    id: 'carnes_pescados',
    name: 'Carnes, Aves, Embutidos e Pescados',
    group: 'Origem Animal (MAPA / POA)',
    authority: 'MAPA (RIISPOA) + ANVISA RDC 429 / 727',
    physicalState: 'solido',
    requiresAnimalStamp: true,
    defaultStamp: 'SIF',
    requiresNutrition: true,
    mandatoryNotes: [
      'Carimbo de inspeção sanitária obrigatório (SIF, SIE, SIM ou SISBI-POA).',
      'Informar temperatura de conservação (Resfriado ou Congelado) e modo de preparo se carne crua de aves/suínos.',
      'Atenção à lupa frontal de SÓDIO e GORDURA SATURADA em embutidos e temperados.',
    ],
    defaultAllergensHint: 'ALÉRGICOS: PODE CONTER DERIVADOS DE SOJA.',
  },
  {
    id: 'ovos_mel',
    name: 'Mel, Produtos Apícolas e Ovoprodutos',
    group: 'Origem Animal (MAPA / POA)',
    authority: 'MAPA (RIISPOA) + ANVISA RDC 429',
    physicalState: 'solido',
    requiresAnimalStamp: true,
    defaultStamp: 'SIF',
    requiresNutrition: true,
    mandatoryNotes: [
      'Carimbo de inspeção sanitária obrigatório (SIF, SIE, SIM ou Selo ARTE).',
      'Para mel puro: advertência recomendada para não consumo por crianças menores de 1 ano.',
    ],
    defaultAllergensHint: '',
  },
  {
    id: 'cereais_panificacao',
    name: 'Cereais, Granolas, Massas, Pães e Biscoitos',
    group: 'Alimentos de Origem Vegetal / Processados',
    authority: 'ANVISA (RDC 727, RDC 429, IN 75, Lei 10.674)',
    physicalState: 'solido',
    requiresAnimalStamp: false,
    defaultStamp: 'nenhum',
    requiresNutrition: true,
    mandatoryNotes: [
      'Declaração obrigatória de glúten (CONTÉM GLÚTEN ou NÃO CONTÉM GLÚTEN).',
      'Listar cereais alergênicos (trigo, aveia, centeio, cevada) e oleaginosas na declaração ALÉRGICOS.',
      'Cálculo da tabela nutricional por 100 g e por porção com verificação de lupas.',
    ],
    defaultAllergensHint: 'ALÉRGICOS: CONTÉM DERIVADOS DE TRIGO E AVEIA.',
  },
  {
    id: 'doces_confeitaria',
    name: 'Doces, Chocolates, Geleias e Confeitaria',
    group: 'Alimentos de Origem Vegetal / Processados',
    authority: 'ANVISA (RDC 727, RDC 429, IN 75)',
    physicalState: 'solido',
    requiresAnimalStamp: false,
    defaultStamp: 'nenhum',
    requiresNutrition: true,
    mandatoryNotes: [
      'Verificar limite de Lupa Frontal para AÇÚCAR ADICIONADO (≥ 15 g/100 g) e GORDURA SATURADA (≥ 6 g/100 g).',
      'Informar percentual de cacau quando aplicável (chocolates).',
    ],
    defaultAllergensHint: 'ALÉRGICOS: PODE CONTER AMENDOIM, CASTANHAS E LEITE.',
  },
  {
    id: 'molhos_conservas',
    name: 'Molhos, Temperos, Óleos e Conservas',
    group: 'Alimentos de Origem Vegetal / Processados',
    authority: 'ANVISA (RDC 727, RDC 429, IN 75)',
    physicalState: 'solido',
    requiresAnimalStamp: false,
    defaultStamp: 'nenhum',
    requiresNutrition: true,
    mandatoryNotes: [
      'Atenção redobrada ao limite de SÓDIO para Lupa Frontal (≥ 600 mg/100 g ou ≥ 300 mg/100 ml).',
      'Indicar peso líquido e peso drenado em conservas.',
    ],
    defaultAllergensHint: 'ALÉRGICOS: PODE CONTER DERIVADOS DE SOJA E MOSTARDA.',
  },
  {
    id: 'bebidas_nao_alcoolicas',
    name: 'Bebidas Não Alcoólicas (Sucos, Néctares, Chás, Refrigerantes)',
    group: 'Bebidas',
    authority: 'MAPA (Decreto 6.871/2009) + ANVISA (RDC 429 / IN 75)',
    physicalState: 'liquido',
    requiresAnimalStamp: false,
    defaultStamp: 'nenhum',
    requiresNutrition: true,
    mandatoryNotes: [
      'Registro obrigatório de estabelecimento e produto no MAPA (SIPEAGRO).',
      'Tabela nutricional expressa em 100 ml e por porção em ml (limites de lupa: ≥ 7,5 g açúcar, ≥ 3 g gord. sat., ≥ 300 mg sódio por 100 ml).',
      'Informar teor percentual de suco/polpa de fruta quando aplicável.',
    ],
    defaultAllergensHint: '',
  },
  {
    id: 'bebidas_alcoolicas',
    name: 'Bebidas Alcoólicas (Cervejas, Vinhos, Destilados, Coquetéis)',
    group: 'Bebidas',
    authority: 'MAPA (Decreto 6.871/2009) + Lei 9.294/1996',
    physicalState: 'liquido',
    requiresAnimalStamp: false,
    defaultStamp: 'nenhum',
    requiresNutrition: false,
    mandatoryNotes: [
      'Registro obrigatório no MAPA e indicação da graduação alcoólica (% vol.).',
      'Advertência legal obrigatória: "EVITE O CONSUMO EXCESSIVO DE ÁLCOOL" / "PROIBIDA A VENDA PARA MENORES DE 18 ANOS".',
      'Tabela nutricional facultativa (RDC 429), exceto se houver alegação nutricional.',
    ],
    defaultAllergensHint: 'ALÉRGICOS: CONTÉM CEVADA (para cervejas e maltes).',
    defaultAlcoholWarning: 'EVITE O CONSUMO EXCESSIVO DE ÁLCOOL. PROIBIDA A VENDA PARA MENORES DE 18 ANOS.',
  },
];

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  rascunho: 'Rascunho',
  revisao: 'Em revisão',
  aprovado: 'Aprovado',
};

export const ANIMAL_STAMP_LABELS: Record<AnimalStampType, string> = {
  nenhum: 'Não aplicável',
  SIF: 'SIF — Serviço de Inspeção Federal (MAPA)',
  SIE: 'SIE — Serviço de Inspeção Estadual',
  SIM: 'SIM — Serviço de Inspeção Municipal',
  SISBI: 'SISBI-POA — Sistema Brasileiro de Inspeção',
  ARTE: 'Selo ARTE — Produto Artesanal',
};

export const DEFAULT_LABEL_DESIGN: LabelDesignSettings = {
  logoDataUrl: '',
  logoHeightPx: 40,
  logoPosition: 'left',
  customWidthMm: 100,
  customHeightMm: 150,
  titleFontPx: 16,
  bodyFontPx: 9.5,
  nutritionScale: 1,
  lupaScale: 1,
  lupaLayout: 'horizontal',
  barcodeWidthPx: 136,
  showHeaderBanner: true,
  showSubtitleOnLabel: true,
  sectionOrder: ['lupa', 'composicao', 'nutricao', 'ghs'],
};

export const DEFAULT_ANIMAL_STAMP: AnimalOriginStamp = {
  type: 'nenhum',
  registrationNumber: '0000',
  regionLabel: 'BRASIL',
  stampSizePx: 56,
};
