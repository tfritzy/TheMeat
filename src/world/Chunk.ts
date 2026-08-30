import { CELLS_PER_CHUNK, CHUNK_SIZE } from './constants';
import {
  EMPTY_CELL,
  getCellMaterial,
  getCellVelocityX,
  getCellVelocityY,
  type PackedCell,
  withCellMaterial,
  withCellVelocity,
} from './Cell';
import { MaterialId } from './Material';

export class Chunk {
  private readonly cells = new Uint32Array(CELLS_PER_CHUNK);
  private readonly updateStamps = new Uint32Array(CELLS_PER_CHUNK);

  public revision = 0;

  public constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  public getCell(localX: number, localY: number): PackedCell {
    return this.cells[this.indexOf(localX, localY)] ?? EMPTY_CELL;
  }

  public getCellByIndex(index: number): PackedCell {
    return this.cells[index] ?? EMPTY_CELL;
  }

  public setCell(localX: number, localY: number, cell: PackedCell): void {
    this.setCellByIndex(this.indexOf(localX, localY), cell);
  }

  public setCellByIndex(index: number, cell: PackedCell): boolean {
    const packedCell = cell >>> 0;

    if (this.cells[index] === packedCell) return false;

    this.cells[index] = packedCell;
    this.revision += 1;
    return true;
  }

  public getMaterial(localX: number, localY: number): MaterialId {
    return getCellMaterial(this.getCell(localX, localY));
  }

  public setMaterial(
    localX: number,
    localY: number,
    material: MaterialId,
  ): void {
    this.setCell(
      localX,
      localY,
      withCellMaterial(this.getCell(localX, localY), material),
    );
  }

  public getVelocityX(localX: number, localY: number): number {
    return getCellVelocityX(this.getCell(localX, localY));
  }

  public getVelocityY(localX: number, localY: number): number {
    return getCellVelocityY(this.getCell(localX, localY));
  }

  public setVelocity(
    localX: number,
    localY: number,
    velocityX: number,
    velocityY: number,
  ): void {
    this.setCell(
      localX,
      localY,
      withCellVelocity(this.getCell(localX, localY), velocityX, velocityY),
    );
  }

  public getUpdateStamp(index: number): number {
    return this.updateStamps[index] ?? 0;
  }

  public setUpdateStamp(index: number, stamp: number): void {
    this.updateStamps[index] = stamp;
  }

  public clearUpdateStamps(): void {
    this.updateStamps.fill(0);
  }

  private indexOf(localX: number, localY: number): number {
    return localY * CHUNK_SIZE + localX;
  }
}
