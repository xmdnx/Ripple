export const textMeasureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
export function measureTextWidth(text, font = "600 13px OpenRunde, Arial, sans-serif") {
  if (!text) return 0;
  if (!textMeasureCanvas || !textMeasureCanvas.getContext) return 0;
  const ctx = textMeasureCanvas.getContext("2d");
  if (!ctx) return 0;
  const fontStr = typeof font === "number" ? `${font}px OpenRunde, Arial, sans-serif` : font;
  ctx.font = fontStr;
  return ctx.measureText(String(text)).width;
}