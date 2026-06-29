import { reshape } from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

export function arabic(text?: string) {
  if (!text) return "";

  const reshaped = reshape(text);

  return bidi.getReorderedString(
    reshaped,
    bidi.getEmbeddingLevels(reshaped).paragraphs[0]
  );
}