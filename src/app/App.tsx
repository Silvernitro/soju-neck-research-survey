import { useEffect, useRef, useState } from 'react';
import { stimulusConfig, stimulusUrl } from '../config/stimulus';
import type { StimulusGeometry } from '../renderer/deformMesh';
import { NeckRenderer } from '../renderer/NeckRenderer';
import './app.css';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<NeckRenderer | null>(null);
  const [width, setWidth] = useState<number>(stimulusConfig.initialWidth);
  const [status, setStatus] = useState('Loading portrait…');

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let onWindowResize: (() => void) | null = null;

    async function setup() {
      try {
        const response = await fetch(stimulusUrl('stimulus/geometry.json'));
        if (!response.ok) throw new Error(`Geometry request failed (${response.status})`);
        const geometry = await response.json() as StimulusGeometry;
        const image = new Image();
        image.decoding = 'async';
        image.src = stimulusUrl('stimulus/portrait.jpg');
        await image.decode();
        if (cancelled || !canvasRef.current) return;

        const renderer = new NeckRenderer(canvasRef.current, image, geometry);
        rendererRef.current = renderer;
        renderer.setDeformation(width);
        observer = new ResizeObserver(() => renderer.resize());
        observer.observe(canvasRef.current);
        onWindowResize = () => renderer.resize();
        window.addEventListener('resize', onWindowResize);
        setStatus('');
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'Unable to load portrait.');
      }
    }

    void setup();
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (onWindowResize) window.removeEventListener('resize', onWindowResize);
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
    // The renderer is initialized once; slider updates are sent below.
  }, []);

  useEffect(() => {
    rendererRef.current?.setDeformation(width);
  }, [width]);

  return (
    <main className="study-shell">
      <section className="study-card" aria-labelledby="study-title">
        <header>
          <p className="eyebrow">Portrait perception study</p>
          <h1 id="study-title">Adjust the portrait</h1>
          <p className="instructions">
            Move the slider until the person’s neck looks most natural to you. There are no right or
            wrong answers—please use your first impression.
          </p>
        </header>

        <div className="portrait-frame">
          <canvas ref={canvasRef} aria-label="Portrait with adjustable neck width" />
          {status && <p className="canvas-status" role="status">{status}</p>}
        </div>

        <div className="control-group">
          <label htmlFor="neck-width">Neck appearance</label>
          <div className="range-row">
            <span aria-hidden="true">Narrower</span>
            <input
              id="neck-width"
              type="range"
              min="-1"
              max="1"
              step={stimulusConfig.sliderStep}
              value={width}
              onChange={(event) => setWidth(event.currentTarget.valueAsNumber)}
            />
            <span aria-hidden="true">Wider</span>
          </div>
        </div>
      </section>
    </main>
  );
}
