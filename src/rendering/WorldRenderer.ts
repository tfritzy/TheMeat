import { Color, OrthographicCamera, Scene, WebGLRenderer } from "three";

import { Chunk } from "../world/Chunk";
import { VIEW_HEIGHT_IN_CELLS } from "../world/constants";
import { World } from "../world/World";
import { ChunkView } from "./ChunkView";

export class WorldRenderer {
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly renderer = new WebGLRenderer({ antialias: false });
  private readonly chunkViews = new Map<Chunk, ChunkView>();
  private readonly resizeObserver: ResizeObserver;

  public constructor(
    container: HTMLElement,
    private readonly world: World,
  ) {
    this.scene.background = new Color(0x111318);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.append(this.renderer.domElement);

    this.resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) this.resize(entry.contentRect.width, entry.contentRect.height);
    });
    this.resizeObserver.observe(container);
    this.resize(container.clientWidth, container.clientHeight);

    document.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key == "w") {
        this.camera.position.y += 10;
      }
      if (ev.key == "d") {
        this.camera.position.x += 10;
      }
      if (ev.key == "s") {
        this.camera.position.y -= 10;
      }
      if (ev.key == "a") {
        this.camera.position.x -= 10;
      }
    };
  }

  public render(): void {
    this.syncChunkViews();

    for (const view of this.chunkViews.values()) {
      view.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.resizeObserver.disconnect();

    for (const view of this.chunkViews.values()) {
      view.dispose();
    }

    this.chunkViews.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  public toWorldX(screenX: number): number {
    const rect = this.renderer.domElement.getBoundingClientRect();

    const normalizedX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const halfWorldWidth = (this.camera.right - this.camera.left) / 2;

    return Math.floor(this.camera.position.x + normalizedX * halfWorldWidth);
  }

  public toWorldY(screenY: number): number {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const t = (screenY - rect.top) / rect.height;

    return Math.floor(
      this.camera.position.y +
        this.camera.top -
        t * (this.camera.top - this.camera.bottom),
    );
  }

  private syncChunkViews(): void {
    for (const chunk of this.world.loadedChunks) {
      if (this.chunkViews.has(chunk)) continue;

      const view = new ChunkView(chunk);
      this.chunkViews.set(chunk, view);
      this.scene.add(view.mesh);
    }
  }

  private resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    const visibleWorldWidth = VIEW_HEIGHT_IN_CELLS * (width / height);
    this.camera.left = -visibleWorldWidth / 2;
    this.camera.right = visibleWorldWidth / 2;
    this.camera.top = VIEW_HEIGHT_IN_CELLS / 2;
    this.camera.bottom = -VIEW_HEIGHT_IN_CELLS / 2;
    this.camera.near = 0.1;
    this.camera.far = 100;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}
