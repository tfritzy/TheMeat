import { Color, OrthographicCamera, Scene, WebGLRenderer } from "three";

import { Chunk } from "../world/Chunk";
import { VIEW_HEIGHT_IN_CELLS } from "../world/constants";
import { EntityId } from "../world/Entity";
import { World } from "../world/World";
import { CharacterView } from "./CharacterView";
import { ChunkView } from "./ChunkView";

export class WorldRenderer {
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly renderer = new WebGLRenderer({ antialias: false });
  private readonly chunkViews = new Map<Chunk, ChunkView>();
  private readonly characterViews = new Map<EntityId, CharacterView>();
  private readonly resizeObserver: ResizeObserver;

  public constructor(
    container: HTMLElement,
    private readonly world: World,
    private readonly cameraTargetId: EntityId,
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
  }

  public render(): void {
    this.syncChunkViews();
    this.syncCharacterViews();

    for (const view of this.chunkViews.values()) {
      view.update();
    }

    for (const view of this.characterViews.values()) {
      view.update();
    }

    const cameraTarget = this.world.characters.get(this.cameraTargetId);
    if (cameraTarget) {
      this.camera.position.x = cameraTarget.rigidBody.gridX;
      this.camera.position.y = cameraTarget.rigidBody.gridY;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.resizeObserver.disconnect();

    for (const view of this.chunkViews.values()) {
      view.dispose();
    }

    for (const view of this.characterViews.values()) {
      view.dispose();
    }

    this.chunkViews.clear();
    this.characterViews.clear();
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

  private syncCharacterViews(): void {
    for (const [id, character] of this.world.characters) {
      if (this.characterViews.has(id)) continue;

      const view = new CharacterView(character);
      this.characterViews.set(id, view);
      this.scene.add(view.mesh);
    }

    for (const [id, view] of this.characterViews) {
      if (this.world.characters.has(id)) continue;

      this.scene.remove(view.mesh);
      view.dispose();
      this.characterViews.delete(id);
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
