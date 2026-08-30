import { MaterialId } from './Material';
import { World } from './World';

export function createInitialWorld(): World {
  const world = new World();

  for (let x = -128; x < 128; x += 1) {
    for (let y = -64; y < -48; y += 1) {
      world.setMaterial(x, y, MaterialId.Stone);
    }
  }

  return world;
}
