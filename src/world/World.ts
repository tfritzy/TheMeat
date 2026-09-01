import { Chunk } from "./Chunk";
import { getCellMaterial, packCell, type PackedCell } from "./Cell";
import { CHUNK_SIZE, ChunkRange } from "./constants";
import { MaterialId } from "./Material";

const BOUNDARY_CELL = packCell(MaterialId.Stone);

export class World {
  public width: number;
  public height: number;

  private readonly chunks = new Set<Chunk>();
  private readonly chunkRows = new Map<number, Map<number, Chunk>>();

  public constructor(chunkRange: ChunkRange) {
    this.validateChunkRange(chunkRange);
    this.width = (chunkRange.maximumX - chunkRange.minimumX) * CHUNK_SIZE;
    this.height = (chunkRange.maximumY - chunkRange.minimumY) * CHUNK_SIZE;

    for (
      let chunkY = chunkRange.minimumY;
      chunkY <= chunkRange.maximumY;
      chunkY += 1
    ) {
      const row = new Map<number, Chunk>();
      this.chunkRows.set(chunkY, row);

      for (
        let chunkX = chunkRange.minimumX;
        chunkX <= chunkRange.maximumX;
        chunkX += 1
      ) {
        const chunk = new Chunk(chunkX, chunkY);
        row.set(chunkX, chunk);
        this.chunks.add(chunk);
      }
    }
  }

  public get loadedChunks(): ReadonlySet<Chunk> {
    return this.chunks;
  }

  public getCell(worldX: number, worldY: number): PackedCell {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkY);

    if (!chunk) return BOUNDARY_CELL;

    return chunk.getCell(
      worldX - chunkX * CHUNK_SIZE,
      worldY - chunkY * CHUNK_SIZE,
    );
  }

  public setCell(worldX: number, worldY: number, cell: PackedCell): void {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkY = Math.floor(worldY / CHUNK_SIZE);
    const chunk = this.getChunk(chunkX, chunkY);
    if (!chunk) return;
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
    this.setCell(worldX, worldY, packCell(material));
  }

  public getChunk(chunkX: number, chunkY: number): Chunk | undefined {
    return this.chunkRows.get(chunkY)?.get(chunkX);
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
      targetChunk?.getCellByIndex(targetY * CHUNK_SIZE + targetX) ??
      BOUNDARY_CELL
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
      const adjacentChunk = this.getChunk(
        origin.x + chunkOffsetX,
        origin.y + chunkOffsetY,
      );
      if (!adjacentChunk) return;
      targetChunk = adjacentChunk;
    }
    const sourceIndex = localY * CHUNK_SIZE + localX;
    const targetIndex = targetY * CHUNK_SIZE + targetX;
    const displacedCell = targetChunk.getCellByIndex(targetIndex);

    origin.setCellByIndex(sourceIndex, displacedCell);
    targetChunk.setCellByIndex(targetIndex, movingCell);
    origin.setUpdateStamp(sourceIndex, updateStamp);
    targetChunk.setUpdateStamp(targetIndex, updateStamp);
  }

  public clearUpdateStamps(): void {
    for (const chunk of this.chunks) chunk.clearUpdateStamps();
  }

  private validateChunkRange(chunkRange: ChunkRange): void {
    if (
      !Number.isInteger(chunkRange.minimumX) ||
      !Number.isInteger(chunkRange.minimumY) ||
      !Number.isInteger(chunkRange.maximumX) ||
      !Number.isInteger(chunkRange.maximumY) ||
      chunkRange.minimumX > chunkRange.maximumX ||
      chunkRange.minimumY > chunkRange.maximumY
    ) {
      throw new RangeError(
        "Chunk range must contain valid inclusive integers.",
      );
    }
  }
}
