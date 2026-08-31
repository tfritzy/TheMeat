import { MaterialId } from './Material';
import { CHUNK_SIZE, type ChunkRange } from './constants';
import { World } from './World';

export function createInitialWorld(
  chunkRange: ChunkRange,
  faucetX: number,
  faucetY: number,
): World {
  const world = new World(chunkRange);
  const worldMinimumX = chunkRange.minimumX * CHUNK_SIZE;
  const worldMaximumX = (chunkRange.maximumX + 1) * CHUNK_SIZE;
  const worldMaximumY = (chunkRange.maximumY + 1) * CHUNK_SIZE - 1;

  for (let x = worldMinimumX; x < worldMaximumX; x += 1) {
    for (let y = -64; y < -48; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  for (let x = faucetX; x <= faucetX + 6; x += 1) {
    for (let y = faucetY; y <= faucetY + 2; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  for (let x = faucetX + 4; x <= faucetX + 6; x += 1) {
    for (let y = faucetY; y <= worldMaximumY; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  return world;
}
