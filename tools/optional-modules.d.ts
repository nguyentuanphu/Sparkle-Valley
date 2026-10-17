// Packages a tool uses only when they happen to be installed (never a dependency of the game): the parts it calls.
// tools/fetch-landmark-photos.mts resizes photos with sharp when it is there.
declare module 'sharp' {
  type Image = {
    rotate(): Image, resize(o: { width: number, height: number, fit: 'inside', withoutEnlargement: boolean }): Image,
    jpeg(o: { quality: number, mozjpeg: boolean }): Image, toBuffer(): Promise<Buffer>,
  };
  const sharp: (input: Buffer) => Image;
  export default sharp;
}
