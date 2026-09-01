import { getCellMaterial, type PackedCell } from "../world/Cell";
import { type Chunk } from "../world/Chunk";
import { CHUNK_SIZE } from "../world/constants";
import {
  MATERIAL_BEHAVIORS,
  MATERIAL_DENSITIES,
  MaterialBehavior,
} from "../world/Material";
import { World } from "../world/World";

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
        const density = MATERIAL_DENSITIES[material] ?? 0;

        if (behavior === MaterialBehavior.Powder) {
          this.updatePowder(chunk, localX, localY, cell, density);
        } else if (behavior === MaterialBehavior.Liquid) {
          this.updateLiquid(chunk, localX, localY, cell, density);
        }
      }
    }
  }

  private updatePowder(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    density: number,
  ): void {
    if (this.tryMoveRelative(chunk, localX, localY, cell, density, 0, -1)) {
      return;
    }

    this.tryMoveEitherDirection(chunk, localX, localY, cell, density, -1);
  }

  private updateLiquid(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    density: number,
  ): void {
    if (
      this.tryMoveRelative(chunk, localX, localY, cell, density, 0, -1) ||
      this.tryMoveEitherDirection(chunk, localX, localY, cell, density, -1)
    ) {
      return;
    }

    this.tryMoveEitherDirection(chunk, localX, localY, cell, density, 0);
  }

  private tryMoveEitherDirection(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    density: number,
    deltaY: number,
  ): boolean {
    const firstDirection = this.getPreferredDirection(chunk, localX, localY);

    return (
      this.tryMoveRelative(
        chunk,
        localX,
        localY,
        cell,
        density,
        firstDirection,
        deltaY,
      ) ||
      this.tryMoveRelative(
        chunk,
        localX,
        localY,
        cell,
        density,
        -firstDirection,
        deltaY,
      )
    );
  }

  private tryMoveRelative(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    density: number,
    deltaX: number,
    deltaY: number,
  ): boolean {
    const target = this.world.getRelativeCell(
      chunk,
      localX,
      localY,
      deltaX,
      deltaY,
    );
    if (!this.canDisplace(target, density)) return false;

    this.world.exchangeRelative(
      chunk,
      localX,
      localY,
      deltaX,
      deltaY,
      cell,
      this.updateStamp,
    );
    return true;
  }

  private canDisplace(target: PackedCell, density: number): boolean {
    const targetMaterial = getCellMaterial(target);

    return (
      MATERIAL_BEHAVIORS[targetMaterial] !== MaterialBehavior.Static &&
      (MATERIAL_DENSITIES[targetMaterial] ?? 0) < density
    );
  }

  private getPreferredDirection(
    chunk: Chunk,
    localX: number,
    localY: number,
  ): number {
    const worldX = chunk.x * CHUNK_SIZE + localX;
    const worldY = chunk.y * CHUNK_SIZE + localY;
    let hash =
      Math.imul(worldX, 0x1f123bb5) ^
      Math.imul(worldY, 0x5f356495) ^
      Math.imul(this.tick, 0x6c8e9cf5);
    hash ^= hash >>> 16;
    return (hash & 1) === 0 ? -1 : 1;
  }

  private advanceUpdateStamp(): void {
    this.updateStamp = (this.updateStamp + 1) >>> 0;
    if (this.updateStamp !== 0) return;

    this.world.clearUpdateStamps();
    this.updateStamp = 1;
  }
}
