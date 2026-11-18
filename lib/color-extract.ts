/**
 * Extracts a theming colour palette from an event flyer image.
 *
 * The flyer is drawn to a hidden canvas and pixels are sampled to build a
 * small histogram of dominant colours. The most saturated/darkest hues are
 * promoted to primary/accent colours so the report matches the flyer branding.
 *
 * Returns `null` when no flyer is available or extraction fails, so callers
 * can fall back to the default brand colours.
 */
export interface FlyerPalette {
    /** Dominant hue – used for brand accents and chart colours. */
    primary: string;
    /** Complementary hue – used for secondary panels and charts. */
    secondary: string;
    /** Light tint derived from the flyer – page background. */
    background: string;
    /** Card surface. */
    surface: string;
    /** Readable body text tone. */
    text: string;
    /** Text/icon colour that reads on top of `primary`. */
    onPrimary: string;
    /** Very light brand tint for icon chips and highlights. */
    subtle: string;
    /** Hairline border derived from the brand colour. */
    border: string;
}

export const DEFAULT_PALETTE: FlyerPalette = {
    primary: '#7C3AED',
    secondary: '#0EA5E9',
    background: '#F7F5FF',
    surface: '#FFFFFF',
    text: '#0F172A',
    onPrimary: '#FFFFFF',
    subtle: '#EDE9FE',
    border: '#DDD6FE',
};

function clamp(value: number): number {
    return Math.min(255, Math.max(0, Math.round(value)));
}

/** Convert an RGB triple to a hex string. */
function rgbToHex(r: number, g: number, b: number): string {
    return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b))
        .toString(16)
        .padStart(6, '0')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const match = hex.replace('#', '').match(/[\da-f]{2}/gi);
    if (!match || match.length < 3) return { r: 124, g: 58, b: 237 };
    return {
        r: parseInt(match[0], 16),
        g: parseInt(match[1], 16),
        b: parseInt(match[2], 16),
    };
}

/** Approximate perceived luminance for sorting. */
function luminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Approximate colour saturation (0-1). */
function saturation(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
}

/** Blend `hex` towards `target` by `amount` (0-1). */
export function mixHex(hex: string, target: string, amount: number): string {
    const from = hexToRgb(hex);
    const to = hexToRgb(target);
    return rgbToHex(
        from.r + (to.r - from.r) * amount,
        from.g + (to.g - from.g) * amount,
        from.b + (to.b - from.b) * amount
    );
}

/** True when white text reads better on this colour than dark text. */
export function isLightColor(hex: string): boolean {
    const { r, g, b } = hexToRgb(hex);
    return luminance(r, g, b) > 165;
}

/** Pick the readable foreground colour for a background colour. */
export function readableTextOn(hex: string): string {
    return isLightColor(hex) ? '#0F172A' : '#FFFFFF';
}

function buildPalette(primary: string, secondary: string): FlyerPalette {
    return {
        primary,
        secondary,
        background: mixHex(primary, '#FFFFFF', 0.94),
        surface: '#FFFFFF',
        text: '#0F172A',
        onPrimary: readableTextOn(primary),
        subtle: mixHex(primary, '#FFFFFF', 0.88),
        border: mixHex(primary, '#FFFFFF', 0.78),
    };
}

function sampleColours(
    canvas: HTMLCanvasElement
): { color: string; weight: number }[] {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const step = 4; // sample every Nth pixel for performance
    const counts: Record<string, number> = {};

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            // Skip transparent pixels and near-white/near-black noise.
            if (a < 128) continue;
            const lum = luminance(r, g, b);
            if (lum > 245 || lum < 12) continue;

            // Quantise colours to bucket similar shades together.
            const q = 24;
            const key = `${Math.floor(r / q) * q},${Math.floor(g / q) * q},${Math.floor(b / q) * q}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    }

    return Object.entries(counts).map(([key, weight]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { color: rgbToHex(r, g, b), weight };
    });
}

function pickPalette(samples: { color: string; weight: number }[]): FlyerPalette {
    if (samples.length === 0) return DEFAULT_PALETTE;

    const ranked = samples
        .map((sample) => {
            const { r, g, b } = hexToRgb(sample.color);
            const sat = saturation(r, g, b);
            const lum = luminance(r, g, b);
            // Favour frequent, saturated colours in the mid-luminance range:
            // those read as brand colours rather than background or shadow.
            const tonePenalty = 1 - Math.abs(lum - 120) / 255;
            const score = sample.weight * (0.35 + 0.65 * sat) * tonePenalty;
            return { ...sample, sat, lum, score };
        })
        .sort((a, b) => b.score - a.score);

    const usable = ranked.filter(
        (entry) => entry.sat >= 0.18 && entry.lum > 25 && entry.lum < 220
    );
    const primaryEntry = usable[0] ?? ranked[0];
    const primary = primaryEntry?.color ?? DEFAULT_PALETTE.primary;

    const primaryRgb = hexToRgb(primary);
    const secondaryEntry = ranked.find((entry) => {
        if (entry.color.toLowerCase() === primary.toLowerCase()) return false;
        if (entry.sat < 0.12) return false;
        if (entry.lum <= 25 || entry.lum >= 230) return false;
        const rgb = hexToRgb(entry.color);
        const distance =
            Math.abs(rgb.r - primaryRgb.r) +
            Math.abs(rgb.g - primaryRgb.g) +
            Math.abs(rgb.b - primaryRgb.b);
        return distance > 90;
    });

    return buildPalette(
        primary,
        secondaryEntry?.color ?? DEFAULT_PALETTE.secondary
    );
}

/**
 * Extract a theming palette from a base64 data URL flyer image.
 *
 * Returns `null` if the image cannot be loaded or has no usable pixels.
 */
export function extractFlyerColors(
    flyerDataUrl: string | null
): Promise<FlyerPalette | null> {
    if (!flyerDataUrl || typeof flyerDataUrl !== 'string') {
        return Promise.resolve(null);
    }

    return new Promise<FlyerPalette | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                // Cap canvas size so extraction stays fast on large flyers.
                const maxDim = 420;
                const scale = Math.min(
                    1,
                    maxDim / Math.max(img.width, img.height)
                );
                canvas.width = Math.max(1, Math.floor(img.width * scale));
                canvas.height = Math.max(1, Math.floor(img.height * scale));

                const ctx = canvas.getContext('2d', {
                    willReadFrequently: true,
                });
                if (!ctx) {
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const samples = sampleColours(canvas);
                resolve(pickPalette(samples));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = flyerDataUrl;
    });
}
