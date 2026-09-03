import { CHUNK_SIZE, type ChunkRange } from "../constants";
import { MaterialId } from "../Material";
import { World } from "../World";

export class MaterialGrid {
  public readonly minimumX: number;
  public readonly minimumY: number;
  public readonly width: number;
  public readonly height: number;
  private readonly cells: Uint8Array;

  public constructor(chunkRange: ChunkRange, initialMaterial: MaterialId) {
    this.minimumX = chunkRange.minimumX * CHUNK_SIZE;
    this.minimumY = chunkRange.minimumY * CHUNK_SIZE;
    this.width =
      (chunkRange.maximumX - chunkRange.minimumX + 1) * CHUNK_SIZE;
    this.height =
      (chunkRange.maximumY - chunkRange.minimumY + 1) * CHUNK_SIZE;
    this.cells = new Uint8Array(this.width * this.height);
    this.cells.fill(initialMaterial);
  }

  public get maximumX(): number {
    return this.minimumX + this.width - 1;
  }

  public get maximumY(): number {
    return this.minimumY + this.height - 1;
  }

  public get(x: number, y: number): MaterialId | undefined {
    const index = this.indexOf(x, y);
    return index === undefined ? undefined : (this.cells[index] as MaterialId);
  }

  public set(x: number, y: number, material: MaterialId): void {
    const index = this.indexOf(x, y);
    if (index !== undefined) this.cells[index] = material;
  }

  public applyTo(world: World): void {
    for (let localY = 0; localY < this.height; localY += 1) {
      for (let localX = 0; localX < this.width; localX += 1) {
        const material = this.cells[localY * this.width + localX];
        if (material === undefined || material === MaterialId.Empty) continue;
        world.setMaterial(
          this.minimumX + localX,
          this.minimumY + localY,
          material,
        );
      }
    }
  }

  private indexOf(x: number, y: number): number | undefined {
    const localX = x - this.minimumX;
    const localY = y - this.minimumY;
    if (
      !Number.isInteger(localX) ||
      !Number.isInteger(localY) ||
      localX < 0 ||
      localX >= this.width ||
      localY < 0 ||
      localY >= this.height
    ) {
      return undefined;
    }
    return localY * this.width + localX;
  }
}
