/**
 * Genuine EAN-13 barcode encoder & Modulo-10 check digit calculator.
 */

const L_CODES = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

const G_CODES = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

const R_CODES = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

const FIRST_DIGIT_PARITY = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
];

export function calculateEan13CheckDigit(first12: string): number {
  const digits = first12.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const num = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? num : num * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export function normalizeEan13(input: string): { code: string; isValid: boolean } {
  const clean = input.replace(/\D/g, '');
  if (clean.length === 12) {
    const check = calculateEan13CheckDigit(clean);
    return { code: `${clean}${check}`, isValid: true };
  }
  if (clean.length === 13) {
    const expected = calculateEan13CheckDigit(clean.slice(0, 12));
    const actual = parseInt(clean[12], 10);
    return { code: clean, isValid: expected === actual };
  }
  const padded = clean.padEnd(12, '0').slice(0, 12);
  const check = calculateEan13CheckDigit(padded);
  return { code: `${padded}${check}`, isValid: false };
}

export function encodeEan13Bits(ean13: string): string {
  const { code } = normalizeEan13(ean13);
  const firstDigit = parseInt(code[0], 10);
  const parity = FIRST_DIGIT_PARITY[firstDigit] || 'LLLLLL';

  let bits = '101'; // Start guard

  // Left 6 digits (indices 1..6)
  for (let i = 0; i < 6; i++) {
    const d = parseInt(code[i + 1], 10);
    bits += parity[i] === 'L' ? L_CODES[d] : G_CODES[d];
  }

  bits += '01010'; // Center guard

  // Right 6 digits (indices 7..12)
  for (let i = 0; i < 6; i++) {
    const d = parseInt(code[i + 7], 10);
    bits += R_CODES[d];
  }

  bits += '101'; // End guard
  return bits;
}

/**
 * Generates a deterministic 21x21 QR-like visual matrix with authentic finder & timing patterns
 * seeded from the input string so SKU/EAN edits immediately change the code geometry.
 */
export function generateDeterministicQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[rr][cc] = false;
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          matrix[rr][cc] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          matrix[rr][cc] = true;
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic hash PRNG
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      h ^= r * 31 + c * 17;
      h = Math.imul(h, 16777619);
      matrix[r][c] = ((h >>> 0) % 100) < 48;
    }
  }

  return matrix;
}
