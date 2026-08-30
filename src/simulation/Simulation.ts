import {
  CELL_VELOCITY_SCALE,
  getCellFractionXRaw,
  getCellFractionYRaw,
  getCellMaterial,
  getCellVelocityXRaw,
  getCellVelocityYRaw,
  type PackedCell,
  withCellMotionUnchecked,
  withCellVelocityRawUnchecked,
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

const GRAVITY_ACCELERATION = 1;
const MAX_GRAVITY_SPEED = 3 * CELL_VELOCITY_SCALE;

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
    const velocityX = getCellVelocityXRaw(cell);
    const previousVelocityY = getCellVelocityYRaw(cell);
    const velocityY =
      previousVelocityY > -MAX_GRAVITY_SPEED
        ? previousVelocityY - GRAVITY_ACCELERATION
        : previousVelocityY;
    const totalX = getCellFractionXRaw(cell) + velocityX;
    const totalY = getCellFractionYRaw(cell) + velocityY;
    const movementX = Math.floor(
      (totalX + CELL_VELOCITY_SCALE / 2) / CELL_VELOCITY_SCALE,
    );
    const movementY = Math.floor(
      (totalY + CELL_VELOCITY_SCALE / 2) / CELL_VELOCITY_SCALE,
    );
    const fractionX = totalX - movementX * CELL_VELOCITY_SCALE;
    const fractionY = totalY - movementY * CELL_VELOCITY_SCALE;
    const density = MATERIAL_DENSITIES[material] ?? 0;
    const movementSteps = Math.max(Math.abs(movementX), Math.abs(movementY));

    if (movementSteps === 0) {
      this.world.setChunkCell(
        chunk,
        localX,
        localY,
        withCellMotionUnchecked(
          cell,
          velocityX,
          velocityY,
          fractionX,
          fractionY,
        ),
        this.updateStamp,
      );
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let collisionX = 0;
    let collisionY = 0;
    let collisionCell = 0;

    for (let step = 1; step <= movementSteps; step += 1) {
      const deltaX = Math.round((movementX * step) / movementSteps);
      const deltaY = Math.round((movementY * step) / movementSteps);
      const target = this.world.getRelativeCell(
        chunk,
        localX,
        localY,
        deltaX,
        deltaY,
      );
      if (!this.canDisplace(target, density)) {
        collisionX = deltaX;
        collisionY = deltaY;
        collisionCell = target;
        break;
      }

      targetX = deltaX;
      targetY = deltaY;
      if (getCellMaterial(target) !== MaterialId.Empty) break;
    }

    if (targetX !== 0 || targetY !== 0) {
      const completed = targetX === movementX && targetY === movementY;
      const movingCell =
        completed || collisionCell === 0
          ? withCellMotionUnchecked(
              cell,
              velocityX,
              velocityY,
              fractionX,
              fractionY,
            )
          : this.transferMomentum(
              chunk,
              localX,
              localY,
              collisionX,
              collisionY,
              targetX,
              targetY,
              cell,
              collisionCell,
              density,
              velocityX,
              velocityY,
            );
      this.world.exchangeRelative(
        chunk,
        localX,
        localY,
        targetX,
        targetY,
        movingCell,
        this.updateStamp,
      );
      return;
    }

    let firstDirection: number;
    if (velocityX !== 0) {
      firstDirection = velocityX < 0 ? -1 : 1;
    } else {
      const worldX = chunk.x * CHUNK_SIZE + localX;
      const worldY = chunk.y * CHUNK_SIZE + localY;
      firstDirection = ((worldX ^ worldY ^ this.tick) & 1) === 0 ? -1 : 1;
    }

    if (movementY < 0) {
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
    }

    const restingCell =
      collisionCell === 0
        ? withCellMotionUnchecked(cell, 0, 0, 0, 0)
        : this.transferMomentum(
            chunk,
            localX,
            localY,
            collisionX,
            collisionY,
            0,
            0,
            cell,
            collisionCell,
            density,
            velocityX,
            velocityY,
          );

    if (restingCell !== cell) {
      this.world.setChunkCell(
        chunk,
        localX,
        localY,
        restingCell,
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
      withCellMotionUnchecked(cell, 0, 0, 0, 0),
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

  private transferMomentum(
    chunk: Chunk,
    localX: number,
    localY: number,
    collisionX: number,
    collisionY: number,
    sourceDestinationX: number,
    sourceDestinationY: number,
    sourceCell: PackedCell,
    targetCell: PackedCell,
    sourceDensity: number,
    sourceVelocityX: number,
    sourceVelocityY: number,
  ): PackedCell {
    const targetMaterial = getCellMaterial(targetCell);
    if (MATERIAL_BEHAVIORS[targetMaterial] === MaterialBehavior.Static) {
      return withCellMotionUnchecked(sourceCell, 0, 0, 0, 0);
    }

    const targetDensity = MATERIAL_DENSITIES[targetMaterial] ?? 0;
    if (targetDensity === 0) {
      return withCellMotionUnchecked(sourceCell, 0, 0, 0, 0);
    }

    const targetVelocityX = getCellVelocityXRaw(targetCell);
    const targetVelocityY = getCellVelocityYRaw(targetCell);
    const normalX = collisionX - sourceDestinationX;
    const normalY = collisionY - sourceDestinationY;
    const normalLength = Math.hypot(normalX, normalY);
    const unitNormalX = normalX / normalLength;
    const unitNormalY = normalY / normalLength;
    const relativeNormalVelocity =
      (sourceVelocityX - targetVelocityX) * unitNormalX +
      (sourceVelocityY - targetVelocityY) * unitNormalY;

    if (relativeNormalVelocity <= 0) {
      return withCellMotionUnchecked(
        sourceCell,
        sourceVelocityX,
        sourceVelocityY,
        0,
        0,
      );
    }

    const impulse =
      (2 * relativeNormalVelocity * sourceDensity * targetDensity) /
      (sourceDensity + targetDensity);
    const nextSourceVelocityX = this.roundSigned(
      sourceVelocityX - (impulse * unitNormalX) / sourceDensity,
    );
    const nextSourceVelocityY = this.roundSigned(
      sourceVelocityY - (impulse * unitNormalY) / sourceDensity,
    );
    const nextTargetVelocityX = this.roundSigned(
      targetVelocityX + (impulse * unitNormalX) / targetDensity,
    );
    const nextTargetVelocityY = this.roundSigned(
      targetVelocityY + (impulse * unitNormalY) / targetDensity,
    );

    this.world.setRelativeCell(
      chunk,
      localX,
      localY,
      collisionX,
      collisionY,
      withCellVelocityRawUnchecked(
        targetCell,
        nextTargetVelocityX,
        nextTargetVelocityY,
      ),
    );

    return withCellMotionUnchecked(
      sourceCell,
      nextSourceVelocityX,
      nextSourceVelocityY,
      0,
      0,
    );
  }

  private roundSigned(value: number): number {
    return value < 0 ? -Math.round(-value) : Math.round(value);
  }

  private advanceUpdateStamp(): void {
    this.updateStamp = (this.updateStamp + 1) >>> 0;
    if (this.updateStamp !== 0) return;

    this.world.clearUpdateStamps();
    this.updateStamp = 1;
  }
}
