/* ------------------------------------------------------------------ */
/*  Image Filter Presets — shared utility                              */
/* ------------------------------------------------------------------ */

export type FilterPreset = "original" | "preset1" | "preset2" | "preset3";

export const PRESET_LABELS: Record<FilterPreset, string> = {
  original: "Original",
  preset1: "#1",
  preset2: "#2",
  preset3: "#3",
};

export const VALID_PRESETS: FilterPreset[] = ["original", "preset1", "preset2", "preset3"];

/* ---- CSS filter for fast rendering on thumbnails / cards ---- */

export function getCSSFilter(preset: string): string {
  switch (preset) {
    case "preset1":
      return "brightness(1.06) contrast(1.10) saturate(1.08)";
    case "preset2":
      return "brightness(1.12) contrast(1.22) saturate(1.20)";
    case "preset3":
      return "brightness(1.18) contrast(1.35) saturate(1.30)";
    default:
      return "none";
  }
}

/* ---- Preset parameters for canvas-based full-quality enhancement ---- */

interface PresetParams {
  brightness: number;
  contrast: number;
  vibrance: number;
  saturation: number;
  warmthR: number;
  warmthG: number;
  warmthB: number;
  sharpenAmount: number;
  shadowLiftMax: number;
}

const PRESET_PARAMS: Record<Exclude<FilterPreset, "original">, PresetParams> = {
  preset1: {
    brightness: 1.06,
    contrast: 1.10,
    vibrance: 0.12,
    saturation: 1.08,
    warmthR: 1,
    warmthG: 0,
    warmthB: -1,
    sharpenAmount: 0.3,
    shadowLiftMax: 10,
  },
  preset2: {
    brightness: 1.12,
    contrast: 1.22,
    vibrance: 0.25,
    saturation: 1.20,
    warmthR: 3,
    warmthG: 1,
    warmthB: -3,
    sharpenAmount: 0.5,
    shadowLiftMax: 18,
  },
  preset3: {
    brightness: 1.18,
    contrast: 1.35,
    vibrance: 0.35,
    saturation: 1.30,
    warmthR: 5,
    warmthG: 2,
    warmthB: -5,
    sharpenAmount: 0.7,
    shadowLiftMax: 25,
  },
};

/* ---- Convolution helper (3x3 kernel) ---- */

function applyConvolution(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[],
  kernelSize: number,
): Uint8ClampedArray {
  const half = Math.floor(kernelSize / 2);
  const output = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const weight = kernel[(ky + half) * kernelSize + (kx + half)];
          r += pixels[idx] * weight;
          g += pixels[idx + 1] * weight;
          b += pixels[idx + 2] * weight;
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx] = r;
      output[outIdx + 1] = g;
      output[outIdx + 2] = b;
      output[outIdx + 3] = pixels[outIdx + 3];
    }
  }
  return output;
}

/* ---- Enhanced image cache ---- */

const enhancedCache = new Map<string, string>();

/* ---- Main enhancement function (canvas-based, full quality) ---- */

export async function enhanceImageWithPreset(
  imageSrc: string,
  preset: FilterPreset,
): Promise<string> {
  if (preset === "original") return imageSrc;

  const cacheKey = `${preset}:${imageSrc}`;
  if (enhancedCache.has(cacheKey)) return enhancedCache.get(cacheKey)!;

  const params = PRESET_PARAMS[preset];

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      /* ---- Pixel-by-pixel adjustments ---- */
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // 1. Shadow recovery
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const shadowLift = Math.max(0, 1 - lum / 80) * params.shadowLiftMax;
        r = Math.min(255, r + shadowLift);
        g = Math.min(255, g + shadowLift);
        b = Math.min(255, b + shadowLift);

        // 2. Brightness
        r = Math.min(255, r * params.brightness);
        g = Math.min(255, g * params.brightness);
        b = Math.min(255, b * params.brightness);

        // 3. Contrast (S-curve around midpoint)
        r = Math.min(255, Math.max(0, (r - 128) * params.contrast + 128));
        g = Math.min(255, Math.max(0, (g - 128) * params.contrast + 128));
        b = Math.min(255, Math.max(0, (b - 128) * params.contrast + 128));

        // 4. Vibrance (boost less-saturated colors more)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
        const vibranceAmount = params.vibrance * (1 - sat);
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, r + (r - avg) * vibranceAmount));
        g = Math.min(255, Math.max(0, g + (g - avg) * vibranceAmount));
        b = Math.min(255, Math.max(0, b + (b - avg) * vibranceAmount));

        // 5. Saturation boost
        const gray2 = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.min(255, Math.max(0, gray2 + (r - gray2) * params.saturation));
        g = Math.min(255, Math.max(0, gray2 + (g - gray2) * params.saturation));
        b = Math.min(255, Math.max(0, gray2 + (b - gray2) * params.saturation));

        // 6. Warmth
        r = Math.min(255, r + params.warmthR);
        g = Math.min(255, g + params.warmthG);
        b = Math.max(0, b + params.warmthB);

        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);

      /* ---- Unsharp Mask for sharpness ---- */
      const sharpData = ctx.getImageData(0, 0, w, h);
      const blurKernel = [
        1 / 16, 2 / 16, 1 / 16,
        2 / 16, 4 / 16, 2 / 16,
        1 / 16, 2 / 16, 1 / 16,
      ];
      const blurred = applyConvolution(sharpData.data, w, h, blurKernel, 3);

      const amount = params.sharpenAmount;
      const sd = sharpData.data;
      for (let i = 0; i < sd.length; i += 4) {
        sd[i] = Math.min(255, Math.max(0, sd[i] + amount * (sd[i] - blurred[i])));
        sd[i + 1] = Math.min(255, Math.max(0, sd[i + 1] + amount * (sd[i + 1] - blurred[i + 1])));
        sd[i + 2] = Math.min(255, Math.max(0, sd[i + 2] + amount * (sd[i + 2] - blurred[i + 2])));
      }
      ctx.putImageData(sharpData, 0, 0);

      const result = canvas.toDataURL("image/jpeg", 0.95);
      enhancedCache.set(cacheKey, result);
      resolve(result);
    };
    img.onerror = () => reject(new Error("Failed to load image for enhancement"));
    img.src = imageSrc;
  });
}
