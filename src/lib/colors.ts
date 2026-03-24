/**
 * Convert a string to an HSL color via simple hash.
 * Useful for generating deterministic placeholder gradients.
 */
export function stringToHSL(
  str: string,
  saturation = 70,
  lightness = 40,
): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
