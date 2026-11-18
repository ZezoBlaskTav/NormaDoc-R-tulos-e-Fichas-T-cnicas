import { NutritionProfile } from '../types/product';

/**
 * ANVISA RDC 429 / IN 75 Reference Daily Values (VDR)
 */
export const ANVISA_VDR = {
  energyKcal: 2000,
  carbs: 300,
  addedSugars: 50,
  proteins: 50,
  totalFat: 65,
  saturatedFat: 20,
  fiber: 25,
  sodiumMg: 2000,
};

/**
 * ANVISA IN 75 Front-of-Pack (Lupa) Thresholds per 100g / 100ml
 */
export const ANVISA_LUPA_THRESHOLDS = {
  solido: {
    addedSugars: 15, // >= 15g per 100g
    saturatedFat: 6, // >= 6g per 100g
    sodiumMg: 600, // >= 600mg per 100g
  },
  liquido: {
    addedSugars: 7.5, // >= 7.5g per 100ml
    saturatedFat: 3, // >= 3g per 100ml
    sodiumMg: 300, // >= 300mg per 100ml
  },
};

export interface ComputedNutritionRow {
  key: string;
  label: string;
  unit: string;
  indent?: boolean;
  per100: string;
  perServing: string;
  vdPercent: string;
}

export interface LupaAlerts {
  highAddedSugar: boolean;
  highSatFat: boolean;
  highSodium: boolean;
  any: boolean;
}

function formatNum(val: number, decimals = 1): string {
  if (val === 0) return '0';
  const rounded = Number(val.toFixed(decimals));
  return rounded.toString().replace('.', ',');
}

export function computeLupaAlerts(nutrition: NutritionProfile): LupaAlerts {
  if (!nutrition.enabled) {
    return { highAddedSugar: false, highSatFat: false, highSodium: false, any: false };
  }

  if (nutrition.lupaMode === 'manual') {
    const any = nutrition.manualLupaSugar || nutrition.manualLupaSatFat || nutrition.manualLupaSodium;
    return {
      highAddedSugar: nutrition.manualLupaSugar,
      highSatFat: nutrition.manualLupaSatFat,
      highSodium: nutrition.manualLupaSodium,
      any,
    };
  }

  const t = ANVISA_LUPA_THRESHOLDS[nutrition.physicalState];
  const highAddedSugar = nutrition.addedSugars100 >= t.addedSugars;
  const highSatFat = nutrition.saturatedFat100 >= t.saturatedFat;
  const highSodium = nutrition.sodiumMg100 >= t.sodiumMg;

  return {
    highAddedSugar,
    highSatFat,
    highSodium,
    any: highAddedSugar || highSatFat || highSodium,
  };
}

export function computeNutritionRows(nutrition: NutritionProfile): ComputedNutritionRow[] {
  const factor = (nutrition.servingSize || 0) / 100;

  const calcServing = (val100: number, decimals = 1) => formatNum(val100 * factor, decimals);
  const calcVd = (val100: number, vdr: number | null) => {
    if (!vdr || vdr <= 0) return '';
    const servingVal = val100 * factor;
    const pct = Math.round((servingVal / vdr) * 100);
    return `${pct}%`;
  };

  return [
    {
      key: 'energy',
      label: 'Valor energético',
      unit: 'kcal',
      per100: formatNum(nutrition.energyKcal100, 0),
      perServing: calcServing(nutrition.energyKcal100, 0),
      vdPercent: calcVd(nutrition.energyKcal100, ANVISA_VDR.energyKcal),
    },
    {
      key: 'carbs',
      label: 'Carboidratos',
      unit: 'g',
      per100: formatNum(nutrition.carbs100, 1),
      perServing: calcServing(nutrition.carbs100, 1),
      vdPercent: calcVd(nutrition.carbs100, ANVISA_VDR.carbs),
    },
    {
      key: 'totalSugars',
      label: 'Açúcares totais',
      unit: 'g',
      indent: true,
      per100: formatNum(nutrition.totalSugars100, 1),
      perServing: calcServing(nutrition.totalSugars100, 1),
      vdPercent: '',
    },
    {
      key: 'addedSugars',
      label: 'Açúcares adicionados',
      unit: 'g',
      indent: true,
      per100: formatNum(nutrition.addedSugars100, 1),
      perServing: calcServing(nutrition.addedSugars100, 1),
      vdPercent: calcVd(nutrition.addedSugars100, ANVISA_VDR.addedSugars),
    },
    {
      key: 'proteins',
      label: 'Proteínas',
      unit: 'g',
      per100: formatNum(nutrition.proteins100, 1),
      perServing: calcServing(nutrition.proteins100, 1),
      vdPercent: calcVd(nutrition.proteins100, ANVISA_VDR.proteins),
    },
    {
      key: 'totalFat',
      label: 'Gorduras totais',
      unit: 'g',
      per100: formatNum(nutrition.totalFat100, 1),
      perServing: calcServing(nutrition.totalFat100, 1),
      vdPercent: calcVd(nutrition.totalFat100, ANVISA_VDR.totalFat),
    },
    {
      key: 'saturatedFat',
      label: 'Gorduras saturadas',
      unit: 'g',
      indent: true,
      per100: formatNum(nutrition.saturatedFat100, 1),
      perServing: calcServing(nutrition.saturatedFat100, 1),
      vdPercent: calcVd(nutrition.saturatedFat100, ANVISA_VDR.saturatedFat),
    },
    {
      key: 'transFat',
      label: 'Gorduras trans',
      unit: 'g',
      indent: true,
      per100: formatNum(nutrition.transFat100, 1),
      perServing: calcServing(nutrition.transFat100, 1),
      vdPercent: '',
    },
    {
      key: 'fiber',
      label: 'Fibras alimentares',
      unit: 'g',
      per100: formatNum(nutrition.fiber100, 1),
      perServing: calcServing(nutrition.fiber100, 1),
      vdPercent: calcVd(nutrition.fiber100, ANVISA_VDR.fiber),
    },
    {
      key: 'sodium',
      label: 'Sódio',
      unit: 'mg',
      per100: formatNum(nutrition.sodiumMg100, 0),
      perServing: calcServing(nutrition.sodiumMg100, 0),
      vdPercent: calcVd(nutrition.sodiumMg100, ANVISA_VDR.sodiumMg),
    },
  ];
}
