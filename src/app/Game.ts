import { WorldRenderer } from "../rendering/WorldRenderer";
import { Simulation } from "../simulation/Simulation";
import { createInitialWorld } from "../world/createInitialWorld";
import { World } from "../world/World";
import { packCell } from "../world/Cell";
import { MaterialId } from "../world/Material";
const FIXED_STEP_SECONDS = 1 / 60;

export class Game {
  private readonly world: World;
  private readonly simulation: Simulation;
  private readonly renderer: WorldRenderer;
  private readonly container: HTMLElement;
  private animationFrame: number | null = null;
  private previousTime: number | null = null;
  private accumulatedTime = 0;
  private simulationTick = 0;
  private material: MaterialId = MaterialId.Sand;

  public constructor(container: HTMLElement) {
    const chunkRange = {
      maximumX: 20,
      maximumY: 10,
      minimumX: 0,
      minimumY: 0,
    };
    this.world = createInitialWorld(chunkRange);
    this.simulation = new Simulation(this.world);
    this.renderer = new WorldRenderer(container, this.world);
    this.container = container;

    container.onmousemove = this.handleMove;
    document.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "1") {
        this.material = MaterialId.Sand;
      } else if (ev.key === "2") {
        this.material = MaterialId.Water;
      } else if (ev.key === "3") {
        this.material = MaterialId.Stone;
      } else if (ev.key === "4") {
        this.material = MaterialId.Empty;
      }
    });
  }

  public start(): void {
    if (this.animationFrame !== null) return;

    const frame = (time: number): void => {
      if (this.previousTime === null) this.previousTime = time;

      const elapsedSeconds = Math.min((time - this.previousTime) / 1_000, 0.1);
      this.previousTime = time;
      this.accumulatedTime += elapsedSeconds;

      while (this.accumulatedTime >= FIXED_STEP_SECONDS) {
        this.simulation.step();
        this.simulationTick += 1;

        this.accumulatedTime -= FIXED_STEP_SECONDS;
      }

      this.renderer.render();
      this.animationFrame = requestAnimationFrame(frame);
    };

    this.animationFrame = requestAnimationFrame(frame);
  }

  public stop(): void {
    if (this.animationFrame === null) return;

    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.previousTime = null;
    this.accumulatedTime = 0;
  }

  handleMove = (ev: MouseEvent) => {
    const x = this.renderer.toWorldX(ev.x);
    const y = this.renderer.toWorldY(ev.y);
    for (let xi = x; xi < x + 5; xi++) {
      for (let yi = y; yi < y + 5; yi++) {
        this.world.setCell(xi, yi, packCell(this.material));
      }
    }
  };
}
