import { MaterialId } from "../Material";
import { PLAYER_HEIGHT, PLAYER_WIDTH } from "../Player";
import { MaterialGrid } from "./MaterialGrid";
import { Noise2D } from "./Noise2D";
import { Random } from "./Random";

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Cavern {
  readonly cells: readonly Point[];
  readonly minimumX: number;
  readonly minimumY: number;
  readonly maximumX: number;
  readonly maximumY: number;
}

export interface CaveGenerationResult {
  readonly playerSpawn: Point;
}

export interface CaveGenerationConfig {
  readonly boundary: number;
  readonly cavernScale: number;
  readonly cavernThreshold: number;
  readonly minimumCavernCells: number;
  readonly warpScale: number;
  readonly warpStrength: number;
  readonly waterCavernRatio: number;
  readonly maximumWaterCaverns: number;
}

export const DEFAULT_CAVE_GENERATION_CONFIG: CaveGenerationConfig = {
  boundary: 10,
  cavernScale: 70,
  cavernThreshold: 0.2,
  minimumCavernCells: 80,
  warpScale: 1000,
  warpStrength: 40,
  waterCavernRatio: 0.3,
  maximumWaterCaverns: 6,
};

export class CaveGenerator {
  private readonly noise: Noise2D;
  private readonly random: Random;

  public constructor(
    private readonly grid: MaterialGrid,
    seed: number,
    private readonly config = DEFAULT_CAVE_GENERATION_CONFIG,
  ) {
    this.noise = new Noise2D(seed);
    this.random = new Random(seed ^ 0x4f1bbcdc);
  }

  public generate(): CaveGenerationResult {
    this.carveNoise();
    const caverns = this.removeSmallCaverns(this.findCaverns());
    const playerSpawn = this.findPlayerSpawn(caverns);
    this.fillWaterCaverns(caverns, playerSpawn);
    return { playerSpawn };
  }

  private carveNoise(): void {
    const boundary = this.config.boundary;
    for (
      let y = this.grid.minimumY + boundary;
      y <= this.grid.maximumY - boundary;
      y += 1
    ) {
      for (
        let x = this.grid.minimumX + boundary;
        x <= this.grid.maximumX - boundary;
        x += 1
      ) {
        const warpX =
          this.noise.fractal(x + 503, y - 211, this.config.warpScale, 2) *
          this.config.warpStrength;
        const warpY =
          this.noise.fractal(x - 347, y + 619, this.config.warpScale, 2) *
          this.config.warpStrength;
        const first = this.noise.fractal(
          (x + warpX) * 0.58,
          y + warpY,
          this.config.cavernScale,
          2,
        );
        if (first > this.config.cavernThreshold) {
          this.grid.set(x, y, MaterialId.Empty);
        }
      }
    }
  }

  private findCaverns(): readonly Cavern[] {
    const visited = new Uint8Array(this.grid.width * this.grid.height);
    const caverns: Cavern[] = [];
    for (let y = this.grid.minimumY; y <= this.grid.maximumY; y += 1) {
      for (let x = this.grid.minimumX; x <= this.grid.maximumX; x += 1) {
        const index = this.indexOf(x, y);
        if (visited[index] !== 0 || this.grid.get(x, y) !== MaterialId.Empty) {
          continue;
        }
        caverns.push(this.floodFill(x, y, visited));
      }
    }
    return caverns;
  }

  private floodFill(
    startX: number,
    startY: number,
    visited: Uint8Array,
  ): Cavern {
    const pending = [{ x: startX, y: startY }];
    const cells: Point[] = [];
    let minimumX = startX;
    let minimumY = startY;
    let maximumX = startX;
    let maximumY = startY;
    while (pending.length > 0) {
      const cell = pending.pop()!;
      if (
        cell.x < this.grid.minimumX ||
        cell.x > this.grid.maximumX ||
        cell.y < this.grid.minimumY ||
        cell.y > this.grid.maximumY
      ) {
        continue;
      }
      const index = this.indexOf(cell.x, cell.y);
      if (visited[index] !== 0) continue;
      visited[index] = 1;
      if (this.grid.get(cell.x, cell.y) !== MaterialId.Empty) continue;
      cells.push(cell);
      minimumX = Math.min(minimumX, cell.x);
      minimumY = Math.min(minimumY, cell.y);
      maximumX = Math.max(maximumX, cell.x);
      maximumY = Math.max(maximumY, cell.y);
      pending.push(
        { x: cell.x - 1, y: cell.y },
        { x: cell.x + 1, y: cell.y },
        { x: cell.x, y: cell.y - 1 },
        { x: cell.x, y: cell.y + 1 },
      );
    }
    return { cells, minimumX, minimumY, maximumX, maximumY };
  }

  private findPlayerSpawn(caverns: readonly Cavern[]): Point {
    const centerX = (this.grid.minimumX + this.grid.maximumX) / 2;
    const centerY = (this.grid.minimumY + this.grid.maximumY) / 2;
    let result: Point | undefined;
    let resultScore = Number.POSITIVE_INFINITY;
    for (const cavern of caverns) {
      if (
        cavern.cells.length < 500 ||
        cavern.maximumY - cavern.minimumY < PLAYER_HEIGHT + 4
      ) {
        continue;
      }
      for (const cell of cavern.cells) {
        if (!this.canSpawnAt(cell.x, cell.y)) continue;
        const score =
          Math.abs(cell.x - centerX) + Math.abs(cell.y - centerY) * 1.4;
        if (score < resultScore) {
          result = cell;
          resultScore = score;
        }
      }
    }
    if (!result)
      throw new Error("Noise generation produced no safe player spawn.");
    return result;
  }

  private removeSmallCaverns(caverns: readonly Cavern[]): readonly Cavern[] {
    const retained: Cavern[] = [];
    for (const cavern of caverns) {
      if (cavern.cells.length >= this.config.minimumCavernCells) {
        retained.push(cavern);
        continue;
      }
      for (const cell of cavern.cells) {
        this.grid.set(cell.x, cell.y, MaterialId.Stone);
      }
    }
    return retained;
  }

  private canSpawnAt(x: number, y: number): boolean {
    for (let offsetX = 0; offsetX < PLAYER_WIDTH; offsetX += 1) {
      if (this.grid.get(x + offsetX, y - 1) !== MaterialId.Stone) return false;
      for (let offsetY = 0; offsetY <= PLAYER_HEIGHT; offsetY += 1) {
        if (this.grid.get(x + offsetX, y + offsetY) !== MaterialId.Empty) {
          return false;
        }
      }
    }
    return true;
  }

  private fillWaterCaverns(caverns: readonly Cavern[], spawn: Point): void {
    const candidates = caverns.filter(
      (cavern) =>
        cavern.cells.length >= this.config.minimumCavernCells &&
        cavern.cells.length <= 6000 &&
        cavern.maximumX - cavern.minimumX >= 12 &&
        cavern.maximumY - cavern.minimumY >= 6 &&
        !contains(cavern, spawn),
    );
    this.random.shuffle(candidates);
    const count = Math.min(
      this.config.maximumWaterCaverns,
      Math.max(2, Math.round(candidates.length * this.config.waterCavernRatio)),
    );
    for (const cavern of candidates.slice(0, count)) {
      for (const cell of cavern.cells) {
        this.grid.set(cell.x, cell.y, MaterialId.Water);
      }
    }
  }

  private indexOf(x: number, y: number): number {
    return (y - this.grid.minimumY) * this.grid.width + x - this.grid.minimumX;
  }
}

function contains(cavern: Cavern, point: Point): boolean {
  return cavern.cells.some((cell) => cell.x === point.x && cell.y === point.y);
}
