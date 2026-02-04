declare module "ogl" {
  export class Renderer {
    constructor(options?: {
      webgl?: number;
      alpha?: boolean;
      antialias?: boolean;
      dpr?: number;
    });
    gl: WebGL2RenderingContext & { canvas: HTMLCanvasElement };
    setSize(width: number, height: number): void;
    render(options: { scene: Mesh }): void;
  }

  export class Program {
    constructor(
      gl: WebGL2RenderingContext,
      options: {
        vertex: string;
        fragment: string;
        uniforms?: Record<string, { value: unknown }>;
      }
    );
    uniforms: Record<string, { value: unknown }>;
  }

  export class Mesh {
    constructor(
      gl: WebGL2RenderingContext,
      options: { geometry: Triangle; program: Program }
    );
  }

  export class Triangle {
    constructor(gl: WebGL2RenderingContext);
  }
}
