import { ArabicShaper } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export function arabic(text?: string) {
  if (!text) return "";

  const shaped = ArabicShaper.convertArabic(text);

  const embedding = bidi.getEmbeddingLevels(shaped);

  return bidi.getReorderedString(shaped, embedding);
}