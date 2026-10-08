// =============================================================================
// zatca.ts — shared helper for ZATCA (Fatoora) e-invoice QR generation.
//
// Implements the ZATCA Phase-1 simplified-invoice QR: a Base64-encoded TLV
// (Tag-Length-Value) byte array with five required tags:
//   1. Seller name
//   2. Seller VAT registration number
//   3. Invoice timestamp (ISO 8601)
//   4. Invoice total (with VAT)
//   5. VAT total
//
// The result is the string embedded into the QR shown on the customer receipt.
// =============================================================================

/** Encode a single TLV field: [tag][length][utf-8 value bytes]. */
function tlv(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  const out = new Uint8Array(2 + valueBytes.length);
  out[0] = tag;
  out[1] = valueBytes.length;
  out.set(valueBytes, 2);
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  // btoa is available in the Deno/Edge runtime.
  return btoa(binary);
}

export interface ZatcaQrInput {
  sellerName: string;
  vatNumber: string;
  /** ISO 8601 timestamp, e.g. new Date().toISOString(). */
  timestamp: string;
  /** Invoice total including VAT, in SAR (e.g. "57.50"). */
  totalWithVat: string;
  /** VAT amount, in SAR (e.g. "7.50"). */
  vatTotal: string;
}

/** Build the ZATCA Base64 TLV QR payload string. */
export function buildZatcaQr(input: ZatcaQrInput): string {
  const bytes = concat([
    tlv(1, input.sellerName),
    tlv(2, input.vatNumber),
    tlv(3, input.timestamp),
    tlv(4, input.totalWithVat),
    tlv(5, input.vatTotal),
  ]);
  return toBase64(bytes);
}

/** Format halalas as a fixed 2-decimal SAR string (e.g. 5750 -> "57.50"). */
export function halalasToSarString(halalas: number): string {
  return (halalas / 100).toFixed(2);
}
