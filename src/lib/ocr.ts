/**
 * OCR STUB — not yet connected to a real service.
 *
 * Options for a real implementation:
 *   - Offline: Tesseract.js (`npm install tesseract.js`) — no API cost, works on-device
 *   - Cloud:   Google Vision API, AWS Textract, Azure Computer Vision
 *
 * To wire in Tesseract.js:
 *   import Tesseract from 'tesseract.js';
 *   const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
 *   return text;
 *
 * Pick the approach that fits your accuracy and cost requirements, then replace
 * this stub. The rest of the Documents module (storage, versioning, AI summary)
 * works independently of OCR.
 */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string | null> {
  // Stub: return null so the caller knows OCR is not available yet
  void buffer;
  void mimeType;
  return null;
}
