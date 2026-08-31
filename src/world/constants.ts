export const CHUNK_SIZE = 32;
export const CELLS_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;
export const VIEW_HEIGHT_IN_CELLS = 192;

export interface ChunkRange {
  readonly minimumX: number;
  readonly minimumY: number;
  readonly maximumX: number;
  readonly maximumY: number;
}

export function getViewportWidthInCells(width: number, height: number): number {
  const aspectRatio = width > 0 && height > 0 ? width / height : 1;
  return VIEW_HEIGHT_IN_CELLS * aspectRatio;
}

export function getViewportChunkRange(
  width: number,
  height: number,
): ChunkRange {
  const visibleWidth = getViewportWidthInCells(width, height);
  const minimumCellX = Math.floor(-visibleWidth / 2);
  const maximumCellX = Math.ceil(visibleWidth / 2) - 1;
  const minimumCellY = -VIEW_HEIGHT_IN_CELLS / 2;
  const maximumCellY = VIEW_HEIGHT_IN_CELLS / 2 - 1;

  return {
    minimumX: Math.floor(minimumCellX / CHUNK_SIZE),
    maximumX: Math.floor(maximumCellX / CHUNK_SIZE),
    minimumY: Math.floor(minimumCellY / CHUNK_SIZE),
    maximumY: Math.floor(maximumCellY / CHUNK_SIZE),
  };
}
