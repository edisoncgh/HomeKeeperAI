declare module "sharp" {
  interface SharpResizeOptions {
    fit?: "cover" | "inside";
    withoutEnlargement?: boolean;
  }

  interface SharpJpegOptions {
    quality?: number;
  }

  interface SharpMetadata {
    height?: number;
    width?: number;
  }

  interface SharpInstance {
    jpeg(options?: SharpJpegOptions): SharpInstance;
    metadata(): Promise<SharpMetadata>;
    resize(width?: number, height?: number, options?: SharpResizeOptions): SharpInstance;
    toBuffer(): Promise<Buffer>;
  }

  interface SharpCreateOptions {
    create: {
      background: { b: number; g: number; r: number };
      channels: number;
      height: number;
      width: number;
    };
  }

  function sharp(input: Buffer | SharpCreateOptions): SharpInstance;
  export default sharp;
}
