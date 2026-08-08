import { stimulusConfig } from '../config/stimulus';
import { createMesh, type Mesh } from './createMesh';
import { deformMesh, type StimulusGeometry } from './deformMesh';
import { fragmentShaderSource, vertexShaderSource } from './shaders';

export class NeckRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private mesh: Mesh;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private uvBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private frame: number | null = null;
  private amount: number = stimulusConfig.initialWidth;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly image: HTMLImageElement,
    private readonly geometry: StimulusGeometry,
  ) {
    this.mesh = createMesh(geometry.mesh.columns, geometry.mesh.rows);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    this.initialize();
  }

  setDeformation(amount: number): void {
    this.amount = amount;
    this.requestDraw();
  }

  resize(): void {
    if (this.disposed) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.requestDraw();
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.deleteResources();
    this.gl = null;
  }

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.gl = null;
  };

  private readonly onContextRestored = () => {
    if (!this.disposed) this.initialize();
  };

  private initialize(): void {
    const gl = this.canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!gl) throw new Error('WebGL 2 is unavailable in this browser.');
    this.gl = gl;
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    this.positionBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.texture = gl.createTexture();
    if (!this.positionBuffer || !this.uvBuffer || !this.indexBuffer || !this.texture) {
      throw new Error('Unable to allocate WebGL resources.');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.mesh.uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indices, gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    this.resize();
  }

  private requestDraw(): void {
    if (this.frame !== null || !this.gl) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  private draw(): void {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.positionBuffer || !this.uvBuffer || !this.indexBuffer) return;
    deformMesh(this.mesh, this.geometry, this.amount, stimulusConfig.maxWidthDelta);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    this.bindAttribute('a_position', this.positionBuffer, this.mesh.positions, gl.DYNAMIC_DRAW);
    this.bindAttribute('a_uv', this.uvBuffer, this.mesh.uvs, gl.STATIC_DRAW, false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  private bindAttribute(name: string, buffer: WebGLBuffer, data: Float32Array, usage: number, upload = true): void {
    const gl = this.gl!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (upload) gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const location = gl.getAttribLocation(this.program!, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl!;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Unable to create shader.');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${message}`);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create WebGL program.');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program linking failed: ${message}`);
    }
    return program;
  }

  private deleteResources(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.uvBuffer) gl.deleteBuffer(this.uvBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.program) gl.deleteProgram(this.program);
  }
}
