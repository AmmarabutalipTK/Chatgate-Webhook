"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arabic = arabic;
const arabic_persian_reshaper_1 = require("arabic-persian-reshaper");
const bidi_js_1 = __importDefault(require("bidi-js"));
const bidi = (0, bidi_js_1.default)();
function arabic(text) {
    if (!text)
        return "";
    const shaped = arabic_persian_reshaper_1.ArabicShaper.convertArabic(text);
    const embedding = bidi.getEmbeddingLevels(shaped);
    return bidi.getReorderedString(shaped, embedding);
}
