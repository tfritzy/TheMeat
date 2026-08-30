import {
  DataTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';

import { Chunk } from '../world/Chunk';
import { getCellMaterial } from '../world/Cell';
import { CHUNK_SIZE } from '../world/constants';
import { MATERIAL_TEXTURE_PIXELS } from '../world/Material';

export class ChunkView {
  public readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;

  private readonly pixels = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * 4);
  private readonly pixelWords = new Uint32Array(this.pixels.buffer);
  private readonly texture: DataTexture;
  private renderedRevision = -1;

  public constructor(private readonly chunk: Chunk) {
    this.texture = new DataTexture(
      this.pixels,
      CHUNK_SIZE,
      CHUNK_SIZE,
      RGBAFormat,
      UnsignedByteType,
    );
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = SRGBColorSpace;

    const geometry = new PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
    });

    this.mesh = new Mesh(geometry, material);
    this.mesh.position.set(
      chunk.x * CHUNK_SIZE + CHUNK_SIZE / 2,
      chunk.y * CHUNK_SIZE + CHUNK_SIZE / 2,
      0,
    );

    this.update();
  }

  public update(): void {
    if (this.renderedRevision === this.chunk.revision) return;

    for (let index = 0; index < CHUNK_SIZE * CHUNK_SIZE; index += 1) {
      const material = getCellMaterial(this.chunk.getCellByIndex(index));
      this.pixelWords[index] = MATERIAL_TEXTURE_PIXELS[material] ?? 0;
    }

    this.texture.needsUpdate = true;
    this.renderedRevision = this.chunk.revision;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}
