import { MaterialId } from './Material';
import { type ChunkRange } from './constants';
import { World } from './World';

export function createInitialWorld(chunkRange: ChunkRange): World {
  const world = new World(chunkRange);

  for (let x = -128; x < 128; x += 1) {
    for (let y = -64; y < -48; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  return world;
}
