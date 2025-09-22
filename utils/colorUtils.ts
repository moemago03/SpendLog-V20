
// utils/colorUtils.ts

/**
 * Determines whether to use black or white text on a given hex color background for best contrast.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @returns "#000000" (black) or "#FFFFFF" (white).
 */
export const getContrastColor = (hex: string): string => {
    if (!hex || hex.length < 7) return '#000000';
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // YIQ color space equation
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    } catch (e) {
        return '#000000';
    }
};

/**
 * Converts a hex color string to an RGBA string.
 * @param hex The hex color string (e.g., "#RRGGBB").
 * @param alpha The alpha transparency value (0-1).
 * @returns The RGBA color string.
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (!hex || hex.length < 7) return `rgba(128, 128, 128, ${alpha})`; // Fallback grey
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
        return `rgba(128, 128, 128, ${alpha})`;
    }
};
