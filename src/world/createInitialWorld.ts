import { type ChunkRange } from "./constants";
import { generateCaveWorld } from "./generation/generateCaveWorld";

export function createInitialWorld(chunkRange: ChunkRange, seed: number) {
  return generateCaveWorld(chunkRange, seed);
}
