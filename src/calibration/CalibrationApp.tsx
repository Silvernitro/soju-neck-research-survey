import { useEffect, useMemo, useRef, useState } from 'react';
import { stimulusConfig, stimulusUrl } from '../config/stimulus';
import { createMesh } from '../renderer/createMesh';
import { deformationInfluence, type StimulusGeometry } from '../renderer/deformMesh';
import { NeckRenderer } from '../renderer/NeckRenderer';
import './calibration.css';

type DragTarget =
  | { kind: 'point'; side: 'left' | 'right'; index: number }
  | { kind: 'center' }
  | { kind: 'horizontal'; key: 'top' | 'jawFadeEnd' | 'shoulderFadeStart' | 'bottom' }
  | { kind: 'vertical'; key: 'left' | 'right' };

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
const spacing = 0.001;
const display = (value: number) => value.toFixed(3);

function cloneGeometry(geometry: StimulusGeometry): StimulusGeometry {
  return JSON.parse(JSON.stringify(geometry)) as StimulusGeometry;
}

export default function CalibrationApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<NeckRenderer | null>(null);
  const dragRef = useRef<DragTarget | null>(null);
  const [geometry, setGeometry] = useState<StimulusGeometry | null>(null);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState('Loading calibration geometry…');

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    void (async () => {
      try {
        const response = await fetch(stimulusUrl('stimulus/geometry.json'));
        if (!response.ok) throw new Error(`Geometry request failed (${response.status})`);
        const nextGeometry = cloneGeometry(await response.json() as StimulusGeometry);
        const image = new Image();
        image.src = stimulusUrl('stimulus/portrait.jpg');
        await image.decode();
        if (cancelled || !canvasRef.current) return;
        rendererRef.current = new NeckRenderer(canvasRef.current, image, nextGeometry);
        observer = new ResizeObserver(() => rendererRef.current?.resize());
        observer.observe(canvasRef.current);
        setGeometry(nextGeometry);
        setStatus('');
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'Unable to load calibration view.');
      }
    })();
    return () => {
      cancelled = true;
      observer?.disconnect();
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (geometry) rendererRef.current?.setGeometry(geometry);
    rendererRef.current?.setDeformation(amount);
  }, [amount, geometry]);

  const vertices = useMemo(() => {
    if (!geometry) return [];
    const mesh = createMesh(geometry.mesh.columns, geometry.mesh.rows);
    const points: Array<{ x: number; y: number; influence: number }> = [];
    const stride = Math.max(1, Math.ceil(Math.max(geometry.mesh.columns, geometry.mesh.rows) / 30));
    for (let row = 0; row <= geometry.mesh.rows; row += stride) {
      for (let column = 0; column <= geometry.mesh.columns; column += stride) {
        const offset = (row * (geometry.mesh.columns + 1) + column) * 2;
        const x = mesh.source[offset];
        const y = mesh.source[offset + 1];
        points.push({ x, y, influence: deformationInfluence(geometry, x, y) });
      }
    }
    return points;
  }, [geometry]);

  function updateFromPointer(event: React.PointerEvent<SVGSVGElement>) {
    const target = dragRef.current;
    if (!target || !geometry) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    setGeometry((current) => {
      if (!current) return current;
      const next = cloneGeometry(current);
      if (target.kind === 'center') next.centerX = clamp(x, next.bounds.left, next.bounds.right);
      if (target.kind === 'vertical') {
        const limit = target.key === 'left' ? next.centerX : 1;
        const minimum = target.key === 'right' ? next.centerX : 0;
        next.bounds[target.key] = clamp(x, minimum, limit);
      }
      if (target.kind === 'horizontal') {
        const limits = {
          top: [0, next.bounds.jawFadeEnd - spacing],
          jawFadeEnd: [next.bounds.top + spacing, next.bounds.shoulderFadeStart - spacing],
          shoulderFadeStart: [next.bounds.jawFadeEnd + spacing, next.bounds.bottom - spacing],
          bottom: [next.bounds.shoulderFadeStart + spacing, 1],
        }[target.key];
        next.bounds[target.key] = clamp(y, limits[0], limits[1]);
      }
      if (target.kind === 'point') {
        const points = next.neck[target.side];
        const previousY = target.index ? points[target.index - 1].y + spacing : 0;
        const nextY = target.index < points.length - 1 ? points[target.index + 1].y - spacing : 1;
        points[target.index] = { x, y: clamp(y, previousY, nextY) };
      }
      return next;
    });
  }

  function beginDrag(event: React.PointerEvent, target: DragTarget) {
    dragRef.current = target;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function exportGeometry() {
    if (!geometry) return;
    const contents = `${JSON.stringify(geometry, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'geometry.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!geometry) return <main className="calibration-loading">{status}</main>;
  const line = (points: typeof geometry.neck.left) => points.map(({ x, y }) => `${x * 1000},${y * 1000}`).join(' ');
  const horizontalKeys = ['top', 'jawFadeEnd', 'shoulderFadeStart', 'bottom'] as const;

  return (
    <main className="calibration-shell">
      <aside className="calibration-panel">
        <p className="dev-badge">Developer tools · not participant-facing</p>
        <h1>Geometry calibration</h1>
        <p>Drag contour nodes and boundary lines. Every coordinate is normalized and clamped to the valid image area.</p>
        <label>Preview deformation <output>{amount.toFixed(2)}</output>
          <input type="range" min="-1" max="1" step="0.01" value={amount} onChange={(event) => setAmount(event.currentTarget.valueAsNumber)} />
        </label>
        <dl>
          <div><dt>Centerline</dt><dd>{display(geometry.centerX)}</dd></div>
          {Object.entries(geometry.bounds).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{display(value)}</dd></div>)}
        </dl>
        <div className="influence-legend"><span>Influence</span><i /> 0 <i /> .5 <i /> 1</div>
        <button className="export-button" type="button" onClick={exportGeometry}>Export replacement geometry.json</button>
        <details><summary>Formatted JSON preview</summary><pre>{JSON.stringify(geometry, null, 2)}</pre></details>
      </aside>

      <section className="calibration-workspace" aria-label="Portrait geometry editor">
        <div className="calibration-frame" ref={frameRef} style={{ aspectRatio: `${geometry.imageSize.width} / ${geometry.imageSize.height}` }}>
          <canvas ref={canvasRef} />
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" onPointerMove={updateFromPointer}
            onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
            <g className="mesh-points">{vertices.map((point, index) => <circle key={index} cx={point.x * 1000} cy={point.y * 1000} r="2.3" style={{ fill: `rgba(255, ${Math.round(220 * (1 - point.influence))}, 40, ${0.18 + point.influence * .75})` }} />)}</g>
            {horizontalKeys.map((key) => <line key={key} className={`bound-line ${key}`} x1="0" x2="1000" y1={geometry.bounds[key] * 1000} y2={geometry.bounds[key] * 1000} onPointerDown={(event) => beginDrag(event, { kind: 'horizontal', key })} />)}
            {(['left', 'right'] as const).map((key) => <line key={key} className="bound-line vertical" y1="0" y2="1000" x1={geometry.bounds[key] * 1000} x2={geometry.bounds[key] * 1000} onPointerDown={(event) => beginDrag(event, { kind: 'vertical', key })} />)}
            <line className="center-line" y1="0" y2="1000" x1={geometry.centerX * 1000} x2={geometry.centerX * 1000} onPointerDown={(event) => beginDrag(event, { kind: 'center' })} />
            <polyline className="contour left" points={line(geometry.neck.left)} />
            <polyline className="contour right" points={line(geometry.neck.right)} />
            {(['left', 'right'] as const).flatMap((side) => geometry.neck[side].map((point, index) => <circle key={`${side}-${index}`} className={`handle ${side}`} cx={point.x * 1000} cy={point.y * 1000} r="11" onPointerDown={(event) => beginDrag(event, { kind: 'point', side, index })} />))}
          </svg>
          {status && <p className="calibration-status">{status}</p>}
        </div>
      </section>
    </main>
  );
}
