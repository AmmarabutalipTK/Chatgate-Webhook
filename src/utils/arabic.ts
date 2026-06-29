import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export function arabic(text?: string) {
  if (!text) return "";

  // Shape Arabic letters
  const shaped = ArabicShaper.convertArabic(text);

  // Reorder for RTL
  return bidi.getReorderedString(
    shaped,
    bidi.getEmbeddingLevels(shaped).paragraphs[0]
  );
}