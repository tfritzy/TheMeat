import {
  CELL_VELOCITY_SCALE,
  getCellMaterial,
  withCellMotionUnchecked,
} from '../world/Cell';
import { CHUNK_SIZE } from '../world/constants';
import { MaterialId } from '../world/Material';
import { World } from '../world/World';

const MAX_IMPULSE = 7;

export function explode(
  world: World,
  centerX: number,
  centerY: number,
  radius: number,
  strength: number,
): number {
  const impulse =
    Math.min(Math.max(strength, 0), MAX_IMPULSE) * CELL_VELOCITY_SCALE;
  const radiusSquared = Math.max(radius, 0) ** 2;
  let affectedCells = 0;

  for (const chunk of world.loadedChunks) {
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const index = localY * CHUNK_SIZE + localX;
        const cell = chunk.getCellByIndex(index);
        if (getCellMaterial(cell) !== MaterialId.Sand) continue;

        const deltaX = chunk.x * CHUNK_SIZE + localX - centerX;
        const deltaY = chunk.y * CHUNK_SIZE + localY - centerY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        if (distanceSquared > radiusSquared) continue;

        const distance = Math.sqrt(distanceSquared);
        const velocityX =
          distance === 0 ? 0 : Math.round((deltaX / distance) * impulse);
        const velocityY =
          distance === 0 ? impulse : Math.round((deltaY / distance) * impulse);

        chunk.setCellByIndex(
          index,
          withCellMotionUnchecked(cell, velocityX, velocityY, 0, 0),
        );
        affectedCells += 1;
      }
    }
  }

  return affectedCells;
}
