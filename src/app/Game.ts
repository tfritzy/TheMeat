import { WorldRenderer } from '../rendering/WorldRenderer';
import { Simulation } from '../simulation/Simulation';
import { packCell } from '../world/Cell';
import { createInitialWorld } from '../world/createInitialWorld';
import { MaterialId } from '../world/Material';

const FIXED_STEP_SECONDS = 1 / 60;
const STREAM_Y = 86;
const STREAM_HALF_WIDTH = 1;
const SPAWN_INTERVAL_TICKS = 2;

export class Game {
  private readonly world = createInitialWorld();
  private readonly simulation = new Simulation(this.world);
  private readonly renderer: WorldRenderer;
  private animationFrame: number | null = null;
  private previousTime: number | null = null;
  private accumulatedTime = 0;
  private simulationTick = 0;

  public constructor(container: HTMLElement) {
    this.renderer = new WorldRenderer(container, this.world);
  }

  public start(): void {
    if (this.animationFrame !== null) return;

    const frame = (time: number): void => {
      if (this.previousTime === null) this.previousTime = time;

      const elapsedSeconds = Math.min((time - this.previousTime) / 1_000, 0.1);
      this.previousTime = time;
      this.accumulatedTime += elapsedSeconds;

      while (this.accumulatedTime >= FIXED_STEP_SECONDS) {
        this.emitDemoSand();
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

  private emitDemoSand(): void {
    if (this.simulationTick % SPAWN_INTERVAL_TICKS !== 0) return;

    const streamWidth = STREAM_HALF_WIDTH * 2 + 1;
    const streamX =
      (Math.floor(this.simulationTick / SPAWN_INTERVAL_TICKS) % streamWidth) -
      STREAM_HALF_WIDTH;

    if (this.world.getMaterial(streamX, STREAM_Y) !== MaterialId.Empty) return;
    this.world.setCell(streamX, STREAM_Y, packCell(MaterialId.Sand));
  }
}
