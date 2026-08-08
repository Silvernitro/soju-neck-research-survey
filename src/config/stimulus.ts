export const stimulusConfig = {
  maxWidthDelta: 0.12,
  sliderStep: 0.01,
  initialWidth: 0,
} as const;

export function stimulusUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
