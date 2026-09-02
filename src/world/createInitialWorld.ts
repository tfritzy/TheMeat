import { MaterialId } from "./Material";
import { CHUNK_SIZE, type ChunkRange } from "./constants";
import { World } from "./World";

export function createInitialWorld(chunkRange: ChunkRange): World {
  const world = new World(chunkRange);
  const worldMinimumX = chunkRange.minimumX * CHUNK_SIZE;
  const worldMaximumX = (chunkRange.maximumX + 1) * CHUNK_SIZE;
  const worldMaximumY = (chunkRange.maximumY + 1) * CHUNK_SIZE - 1;
  const worldMinimumY = chunkRange.minimumY * CHUNK_SIZE;

  for (let x = worldMinimumX; x < worldMaximumX; x += 1) {
    for (let y = worldMinimumY; y < worldMinimumY + 10; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  return world;
}
