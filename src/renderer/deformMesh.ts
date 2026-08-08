import type { Mesh } from './createMesh';

export interface Point { x: number; y: number }
export interface StimulusGeometry {
  imageSize: { width: number; height: number };
  centerX: number;
  neck: { left: Point[]; right: Point[] };
  bounds: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    jawFadeEnd: number;
    shoulderFadeStart: number;
    backgroundFeather: number;
  };
  mesh: { columns: number; rows: number };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function contourX(points: Point[], y: number): number {
  if (y <= points[0].y) return points[0].x;
  for (let i = 1; i < points.length; i += 1) {
    if (y <= points[i].y) {
      const previous = points[i - 1];
      const t = (y - previous.y) / (points[i].y - previous.y);
      return previous.x + (points[i].x - previous.x) * t;
    }
  }
  return points[points.length - 1].x;
}

/** Mutates only target X coordinates; every target Y is reset to its source Y. */
export function deformMesh(
  mesh: Mesh,
  geometry: StimulusGeometry,
  amount: number,
  maxWidthDelta: number,
): Float32Array {
  const { source, positions } = mesh;
  const { bounds, centerX } = geometry;
  const normalizedAmount = Math.max(-1, Math.min(1, amount));

  for (let i = 0; i < source.length; i += 2) {
    const x = source[i];
    const y = source[i + 1];
    positions[i + 1] = y;

    const vertical = smoothstep(bounds.top, bounds.jawFadeEnd, y)
      * (1 - smoothstep(bounds.shoulderFadeStart, bounds.bottom, y));
    if (vertical === 0 || x === centerX) {
      positions[i] = x;
      continue;
    }

    const isLeft = x < centerX;
    const edge = contourX(isLeft ? geometry.neck.left : geometry.neck.right, y);
    const outer = isLeft
      ? Math.max(bounds.left, edge - bounds.backgroundFeather)
      : Math.min(bounds.right, edge + bounds.backgroundFeather);

    let horizontal = 0;
    if (isLeft && x >= centerX) horizontal = 0;
    else if (!isLeft && x <= centerX) horizontal = 0;
    else if (isLeft && x >= edge) horizontal = smoothstep(centerX, edge, x);
    else if (!isLeft && x <= edge) horizontal = 1 - smoothstep(edge, centerX, x);
    else if (isLeft && x > outer) horizontal = smoothstep(outer, edge, x);
    else if (!isLeft && x < outer) horizontal = 1 - smoothstep(edge, outer, x);

    const halfWidth = Math.abs(edge - centerX);
    const direction = isLeft ? -1 : 1;
    positions[i] = x + direction * normalizedAmount * maxWidthDelta * halfWidth * vertical * horizontal;
  }

  return positions;
}
