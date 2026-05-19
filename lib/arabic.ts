/**
 * Normalize an Arabic (or mixed) string so that visually-identical names match
 * regardless of how they were typed. Use for matching only — don't display the
 * normalized form, since it strips meaningful characters (hamzas, diacritics).
 *
 * Steps:
 *  1. Unicode NFC so combining marks live in their canonical order.
 *  2. Strip Arabic tashkeel (fatha, damma, kasra, shadda, sukun, tatweel, etc.).
 *  3. Unify alif variants: أ إ آ ٱ → ا
 *  4. Unify yaa: ى → ي  (alif maqsura → yaa)
 *  5. Unify taa marbuta: ة → ه
 *  6. Unify hamza-on-waw/yaa: ؤ → و, ئ → ي
 *  7. Replace any whitespace (incl. NBSP, tab) with a single space.
 *  8. Trim and lowercase (for any Latin characters mixed in).
 */
export function normalizeArabic(input: string): string {
  return input
    .normalize("NFC")
    // Tashkeel + tatweel range
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "")
    // Alif variants
    .replace(/[آأإٱ]/g, "ا")
    // Alif maqsura → yaa
    .replace(/ى/g, "ي")
    // Taa marbuta → haa
    .replace(/ة/g, "ه")
    // Hamza-on-waw → waw, hamza-on-yaa → yaa
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
