import { Chunk } from './Chunk';
import {
  EMPTY_CELL,
  getCellMaterial,
  getCellVelocityX,
  getCellVelocityY,
  type PackedCell,
  withCellMaterial,
  withCellVelocity,
} from './Cell';
import { CHUNK_SIZE } from './constants';
import { MaterialId } from './Material';

export class World {
  private readonly chunks = new Set<Chunk>();
  private readonly chunkRows = new Map<number, Map<number, Chunk>>();

  public get loadedChunks(): ReadonlySet<Chunk> {
    return this.chunks;
  }

  public getCell(worldX: number, worldY: number): PackedCell {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkY);

    if (!chunk) return EMPTY_CELL;

    return chunk.getCell(
      worldX - chunkX * CHUNK_SIZE,
      worldY - chunkY * CHUNK_SIZE,
    );
  }

  public setCell(worldX: number, worldY: number, cell: PackedCell): void {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(chunkX, chunkY);
    const localX = worldX - chunkX * CHUNK_SIZE;
    const localY = worldY - chunkY * CHUNK_SIZE;

    chunk.setCellByIndex(localY * CHUNK_SIZE + localX, cell);
  }

  public getMaterial(worldX: number, worldY: number): MaterialId {
    return getCellMaterial(this.getCell(worldX, worldY));
  }

  public setMaterial(
    worldX: number,
    worldY: number,
    material: MaterialId,
  ): void {
    this.setCell(
      worldX,
      worldY,
      withCellMaterial(this.getCell(worldX, worldY), material),
    );
  }

  public getVelocityX(worldX: number, worldY: number): number {
    return getCellVelocityX(this.getCell(worldX, worldY));
  }

  public getVelocityY(worldX: number, worldY: number): number {
    return getCellVelocityY(this.getCell(worldX, worldY));
  }

  public setVelocity(
    worldX: number,
    worldY: number,
    velocityX: number,
    velocityY: number,
  ): void {
    this.setCell(
      worldX,
      worldY,
      withCellVelocity(this.getCell(worldX, worldY), velocityX, velocityY),
    );
  }

  public getChunk(chunkX: number, chunkY: number): Chunk | undefined {
    return this.chunkRows.get(chunkY)?.get(chunkX);
  }

  public getOrCreateChunk(chunkX: number, chunkY: number): Chunk {
    let row = this.chunkRows.get(chunkY);
    if (!row) {
      row = new Map<number, Chunk>();
      this.chunkRows.set(chunkY, row);
    }

    let chunk = row.get(chunkX);

    if (!chunk) {
      chunk = new Chunk(chunkX, chunkY);
      row.set(chunkX, chunk);
      this.chunks.add(chunk);
    }

    return chunk;
  }

  public getRelativeCell(
    origin: Chunk,
    localX: number,
    localY: number,
    deltaX: number,
    deltaY: number,
  ): PackedCell {
    let targetX = localX + deltaX;
    let targetY = localY + deltaY;

    if (
      targetX >= 0 &&
      targetX < CHUNK_SIZE &&
      targetY >= 0 &&
      targetY < CHUNK_SIZE
    ) {
      return origin.getCellByIndex(targetY * CHUNK_SIZE + targetX);
    }

    const chunkOffsetX = Math.floor(targetX / CHUNK_SIZE);
    const chunkOffsetY = Math.floor(targetY / CHUNK_SIZE);
    targetX -= chunkOffsetX * CHUNK_SIZE;
    targetY -= chunkOffsetY * CHUNK_SIZE;

    const targetChunk =
      chunkOffsetX === 0 && chunkOffsetY === 0
        ? origin
        : this.getChunk(origin.x + chunkOffsetX, origin.y + chunkOffsetY);

    return (
      targetChunk?.getCellByIndex(targetY * CHUNK_SIZE + targetX) ?? EMPTY_CELL
    );
  }

  public exchangeRelative(
    origin: Chunk,
    localX: number,
    localY: number,
    deltaX: number,
    deltaY: number,
    movingCell: PackedCell,
    updateStamp: number,
  ): void {
    let targetX = localX + deltaX;
    let targetY = localY + deltaY;
    let targetChunk = origin;

    if (
      targetX < 0 ||
      targetX >= CHUNK_SIZE ||
      targetY < 0 ||
      targetY >= CHUNK_SIZE
    ) {
      const chunkOffsetX = Math.floor(targetX / CHUNK_SIZE);
      const chunkOffsetY = Math.floor(targetY / CHUNK_SIZE);
      targetX -= chunkOffsetX * CHUNK_SIZE;
      targetY -= chunkOffsetY * CHUNK_SIZE;
      targetChunk = this.getOrCreateChunk(
        origin.x + chunkOffsetX,
        origin.y + chunkOffsetY,
      );
    }
    const sourceIndex = localY * CHUNK_SIZE + localX;
    const targetIndex = targetY * CHUNK_SIZE + targetX;
    const displacedCell = targetChunk.getCellByIndex(targetIndex);

    origin.setCellByIndex(sourceIndex, displacedCell);
    targetChunk.setCellByIndex(targetIndex, movingCell);
    origin.setUpdateStamp(sourceIndex, updateStamp);
    targetChunk.setUpdateStamp(targetIndex, updateStamp);
  }

  public setChunkCell(
    chunk: Chunk,
    localX: number,
    localY: number,
    cell: PackedCell,
    updateStamp: number,
  ): void {
    const index = localY * CHUNK_SIZE + localX;
    chunk.setUpdateStamp(index, updateStamp);
    chunk.setCellByIndex(index, cell);
  }

  public clearUpdateStamps(): void {
    for (const chunk of this.chunks) chunk.clearUpdateStamps();
  }
}
