// src/lib/text.ts
export function normalizeMojibake(s: string): string {
  return s
    .replace(/Â /g, " ")
    .replace(/Â/g, "")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/â€¢/g, "•")
    .replace(/â€¦/g, "...")
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Å“/g, '"')
    .replace(/Ã¢â‚¬Â¢/g, "•")
    .replace(/Ã¢â‚¬â€œ/g, "-")
    .replace(/Ã¢â‚¬â€�/g, "-")
    .replace(/Ã¢â€žÂ¢/g, "™")
    .replace(/Ãƒâ€šÃ‚Â/g, "");
}
