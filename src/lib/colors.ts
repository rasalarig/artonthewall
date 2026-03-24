/**
 * Convert a string to an HSL color via simple hash.
 * Useful for generating deterministic placeholder gradients.
 * Higher saturation for urban/vibrant aesthetic.
 */
export function stringToHSL(
  str: string,
  saturation = 85,
  lightness = 50,
): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
