export const getTerminalBackground = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--color-chrome")
    .trim() || "hsl(0 0% 5.5%)";

export const getTerminalPalette = () => ({
  background: getTerminalBackground(),
  foreground: "hsl(0 0% 97.6%)",
  cursor: "hsl(115 100% 78.8%)",
  cursorAccent: getTerminalBackground(),
  selectionBackground:
    "color-mix(in srgb, hsl(115 100% 78.8%) 28%, transparent)",
  black: getTerminalBackground(),
  red: "hsl(12 100% 65.9%)",
  green: "hsl(115 100% 78.8%)",
  yellow: "color-mix(in srgb, hsl(115 100% 78.8%) 55%, hsl(0 0% 97.6%))",
  blue: "hsl(186 100% 49.6%)",
  magenta: "color-mix(in srgb, hsl(12 100% 65.9%) 45%, hsl(0 0% 97.6%))",
  cyan: "hsl(186 100% 49.6%)",
  white: "hsl(0 0% 97.6%)",
  brightBlack: "hsl(0 0% 33.3%)",
  brightRed: "color-mix(in srgb, hsl(12 100% 65.9%) 70%, hsl(0 0% 97.6%))",
  brightGreen: "color-mix(in srgb, hsl(115 100% 78.8%) 70%, hsl(0 0% 97.6%))",
  brightYellow: "color-mix(in srgb, hsl(115 100% 78.8%) 40%, hsl(0 0% 97.6%))",
  brightBlue: "color-mix(in srgb, hsl(186 100% 49.6%) 70%, hsl(0 0% 97.6%))",
  brightMagenta: "color-mix(in srgb, hsl(12 100% 65.9%) 30%, hsl(0 0% 97.6%))",
  brightCyan: "color-mix(in srgb, hsl(186 100% 49.6%) 40%, hsl(0 0% 97.6%))",
  brightWhite: "hsl(0 0% 97.6%)",
});
