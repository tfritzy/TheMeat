import {
  getCellMaterial,
  getCellVelocityX,
  getCellVelocityY,
  type PackedCell,
  withCellVelocityUnchecked,
} from '../world/Cell';
import { type Chunk } from '../world/Chunk';
import { CHUNK_SIZE } from '../world/constants';
import {
  MATERIAL_BEHAVIORS,
  MATERIAL_DENSITIES,
  MaterialBehavior,
  MaterialId,
} from '../world/Material';
import { World } from '../world/World';

const MAX_FALL_SPEED = 7;

export class Simulation {
  private updateStamp = 0;
  private tick = 0;

  public processedChunkCount = 0;
  public visitedCellCount = 0;
  public updatedCellCount = 0;

  public constructor(private readonly world: World) {}

  public step(): void {
    this.advanceUpdateStamp();
    this.processedChunkCount = 0;
    this.visitedCellCount = 0;
    this.updatedCellCount = 0;
    const scanRightToLeft = (this.tick & 1) !== 0;

    for (const chunk of this.world.loadedChunks) {
      this.processedChunkCount += 1;
      this.updateChunk(chunk, scanRightToLeft);
    }

    this.tick += 1;
  }

  private updateChunk(chunk: Chunk, scanRightToLeft: boolean): void {
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let offset = 0; offset < CHUNK_SIZE; offset += 1) {
        const localX = scanRightToLeft ? CHUNK_SIZE - offset - 1 : offset;
        this.visitedCellCount += 1;
        const index = localY * CHUNK_SIZE + localX;
        if (chunk.getUpdateStamp(index) === this.updateStamp) continue;

        const cell = chunk.getCellByIndex(index);
        const material = getCellMaterial(cell);
        const behavior = MATERIAL_BEHAVIORS[material];
        if (
          behavior === MaterialBehavior.Empty ||
          behavior === MaterialBehavior.Static
        ) {
          continue;
        }

        chunk.setUpdateStamp(index, this.updateStamp);
        this.updatedCellCount += 1;

        switch (behavior) {
          case MaterialBehavior.Powder:
            this.updatePowder(chunk, localX, localY, cell, material);
            break;
        }
      }
    }
  }

  private updatePowder(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    material: number,
  ): void {
    const velocityX = getCellVelocityX(cell);
    const velocityY = Math.max(getCellVelocityY(cell) - 1, -MAX_FALL_SPEED);
    const density = MATERIAL_DENSITIES[material] ?? 0;
    let fallDistance = 0;

    for (let distance = 1; distance <= -velocityY; distance += 1) {
      const target = this.world.getRelativeCell(
        chunk,
        localX,
        localY,
        0,
        -distance,
      );
      if (!this.canDisplace(target, density)) break;

      fallDistance = distance;
      if (getCellMaterial(target) !== MaterialId.Empty) break;
    }

    if (fallDistance > 0) {
      this.world.exchangeRelative(
        chunk,
        localX,
        localY,
        0,
        -fallDistance,
        withCellVelocityUnchecked(cell, 0, velocityY),
        this.updateStamp,
      );
      return;
    }

    let firstDirection: number;
    if (velocityX === -1 || velocityX === 1) {
      firstDirection = velocityX;
    } else {
      const worldX = chunk.x * CHUNK_SIZE + localX;
      const worldY = chunk.y * CHUNK_SIZE + localY;
      firstDirection = ((worldX ^ worldY ^ this.tick) & 1) === 0 ? -1 : 1;
    }

    if (
      this.tryMoveDiagonal(
        chunk,
        localX,
        localY,
        cell,
        density,
        firstDirection,
      )
    ) {
      return;
    }
    if (
      this.tryMoveDiagonal(
        chunk,
        localX,
        localY,
        cell,
        density,
        -firstDirection,
      )
    ) {
      return;
    }

    if (velocityX !== 0 || getCellVelocityY(cell) !== 0) {
      this.world.setChunkCell(
        chunk,
        localX,
        localY,
        withCellVelocityUnchecked(cell, 0, 0),
        this.updateStamp,
      );
    }
  }

  private tryMoveDiagonal(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    density: number,
    direction: number,
  ): boolean {
    const target = this.world.getRelativeCell(
      chunk,
      localX,
      localY,
      direction,
      -1,
    );
    if (!this.canDisplace(target, density)) return false;

    this.world.exchangeRelative(
      chunk,
      localX,
      localY,
      direction,
      -1,
      withCellVelocityUnchecked(cell, direction, -1),
      this.updateStamp,
    );
    return true;
  }

  private canDisplace(target: PackedCell, density: number): boolean {
    const targetMaterial = getCellMaterial(target);
    const targetBehavior = MATERIAL_BEHAVIORS[targetMaterial];

    return (
      targetBehavior !== MaterialBehavior.Static &&
      (MATERIAL_DENSITIES[targetMaterial] ?? 0) < density
    );
  }

  private advanceUpdateStamp(): void {
    this.updateStamp = (this.updateStamp + 1) >>> 0;
    if (this.updateStamp !== 0) return;

    this.world.clearUpdateStamps();
    this.updateStamp = 1;
  }
}
