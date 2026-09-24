import { ExtractedReceiptData, ScanReceiptResponse } from '../types';

/**
 * Sends a base64 encoded receipt image to the backend OCR parser powered by Gemini 3.8 Flash.
 */
export async function scanReceiptImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  mode: 'personal' | 'sme' = 'personal'
): Promise<ExtractedReceiptData> {
  const response = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      mode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to scan receipt: ${response.statusText}`);
  }

  const data: ScanReceiptResponse = await response.json();
  if (!data.extracted) {
    throw new Error('No transaction details could be extracted from this receipt.');
  }

  return data.extracted;
}
