export const textMeasureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
export function measureTextWidth(text, font = "600 13px OpenRunde, Arial, sans-serif") {
  if (!textMeasureCanvas || !textMeasureCanvas.getContext) return null;
  const ctx = textMeasureCanvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  return ctx.measureText(text).width;
}