import { type ChunkRange } from "../constants";
import { MaterialId } from "../Material";
import { World } from "../World";
import { CaveGenerator } from "./CaveGenerator";
import { MaterialGrid } from "./MaterialGrid";

export interface GeneratedCaveWorld {
  readonly world: World;
  readonly playerSpawn: {
    readonly x: number;
    readonly y: number;
  };
}

export function generateCaveWorld(
  chunkRange: ChunkRange,
  seed: number,
): GeneratedCaveWorld {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError("The world seed must be a safe integer.");
  }
  const world = new World(chunkRange);
  const grid = new MaterialGrid(chunkRange, MaterialId.Stone);
  const result = new CaveGenerator(grid, seed).generate();
  grid.applyTo(world);
  return { world, playerSpawn: result.playerSpawn };
}
