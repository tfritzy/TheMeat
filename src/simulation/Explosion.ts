import {
  EMPTY_CELL,
  getCellMaterial,
} from '../world/Cell';
import { MATERIAL_BEHAVIORS, MaterialBehavior } from '../world/Material';
import { World } from '../world/World';

export function explode(
  world: World,
  centerX: number,
  centerY: number,
  radius: number,
): number {
  if (radius < 0) return 0;

  const radiusSquared = radius * radius;
  const minimumX = Math.ceil(centerX - radius);
  const maximumX = Math.floor(centerX + radius);
  const minimumY = Math.ceil(centerY - radius);
  const maximumY = Math.floor(centerY + radius);
  let destroyedCells = 0;

  for (let worldY = minimumY; worldY <= maximumY; worldY += 1) {
    const deltaY = worldY - centerY;

    for (let worldX = minimumX; worldX <= maximumX; worldX += 1) {
      const deltaX = worldX - centerX;
      if (deltaX * deltaX + deltaY * deltaY > radiusSquared) continue;

      const behavior = MATERIAL_BEHAVIORS[
        getCellMaterial(world.getCell(worldX, worldY))
      ];
      if (
        behavior !== MaterialBehavior.Powder &&
        behavior !== MaterialBehavior.Static
      ) {
        continue;
      }

      world.setCell(worldX, worldY, EMPTY_CELL);
      destroyedCells += 1;
    }
  }

  return destroyedCells;
}
