import { ProductDocument } from '../types/product';
import { normalizeEan13 } from './barcode';

export interface ComplianceCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function evaluateCompliance(product: ProductDocument): ComplianceCheckItem[] {
  const ean = normalizeEan13(product.ean13);

  const checks: ComplianceCheckItem[] = [
    {
      id: 'ean',
      label: 'Código de barras EAN-13 válido',
      passed: ean.isValid,
      detail: ean.isValid ? `GTIN ${ean.code} verificado` : 'Dígito verificador inconsistente',
    },
    {
      id: 'origin-text',
      label: 'Dizeres de Origem no Rótulo',
      passed: Boolean((product.industryOriginText || '').trim()),
      detail: product.industryOriginText
        ? `Exibido: "${product.industryOriginText}"`
        : 'Informe "INDÚSTRIA BRASILEIRA" ou país de origem',
    },
    {
      id: 'manufacturer',
      label: 'Identificação legal e SAC',
      passed: Boolean(
        product.manufacturer.companyName.trim() &&
          product.manufacturer.cnpj.trim() &&
          product.manufacturer.sacPhone.trim()
      ),
      detail: 'Razão social, CNPJ e atendimento ao consumidor',
    },
    {
      id: 'batch',
      label: 'Rastreabilidade (Lote e Validade)',
      passed: Boolean(product.batchFormat.trim() && product.validityDisplay.trim()),
      detail: 'Campos de lote e validade configurados no rótulo',
    },
    {
      id: 'tech-resp',
      label: 'Responsável Técnico e Conselho',
      passed: Boolean(
        product.manufacturer.technicalResponsible.trim() &&
          product.manufacturer.professionalRegistry.trim()
      ),
      detail: 'Assinatura técnica na ficha',
    },
  ];

  if (product.category === 'alimentos') {
    checks.push({
      id: 'food-nutrition',
      label: 'Tabela Nutricional RDC 429',
      passed: product.nutrition.enabled && product.nutrition.servingSize > 0,
      detail: `Modelo ${product.nutrition.tableLayout || 'vertical'} ativo com %VD`,
    });
    checks.push({
      id: 'food-allergens',
      label: 'Alergênicos e Glúten (RDC 727)',
      passed: Boolean(product.allergensText.trim() && product.glutenDeclaration !== 'N/A'),
      detail: 'Declaração obrigatória em caixa alta',
    });
  }

  if (product.category === 'quimicos') {
    checks.push({
      id: 'chem-ghs',
      label: 'Sinalização GHS (ABNT NBR 14725)',
      passed:
        product.ghs.enabled &&
        product.ghs.pictograms.length > 0 &&
        product.ghs.hazardStatements.length > 0,
      detail: 'Pictogramas, palavra de advertência e frases H',
    });
  }

  if (product.category === 'cosmeticos') {
    checks.push({
      id: 'cosm-inci',
      label: 'Composição INCI e PAO',
      passed: Boolean(product.ingredientsText.trim() && product.paoMonths.trim()),
      detail: 'Lista INCI e símbolo de validade após aberto',
    });
  }

  checks.push({
    id: 'tech-specs',
    label: 'Parâmetros de Qualidade na Ficha',
    passed: product.technicalParams.length >= 2,
    detail: `${product.technicalParams.length} parâmetro(s) analítico(s) cadastrado(s)`,
  });

  return checks;
}
