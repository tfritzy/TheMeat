export const CHUNK_SIZE = 32;
export const CELLS_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;
export const VIEW_HEIGHT_IN_CELLS = 384;

export interface ChunkRange {
  readonly minimumX: number;
  readonly minimumY: number;
  readonly maximumX: number;
  readonly maximumY: number;
}
