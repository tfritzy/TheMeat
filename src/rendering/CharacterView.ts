import {
  DataTexture,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

import { Character } from "../world/Character";
import { getCellMaterial } from "../world/Cell";
import { MATERIAL_TEXTURE_PIXELS } from "../world/Material";

export class CharacterView {
  public readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;

  private readonly pixels: Uint8Array;
  private readonly texture: DataTexture;

  public constructor(private readonly character: Character) {
    this.pixels = new Uint8Array(character.width * character.height * 4);
    const pixelWords = new Uint32Array(this.pixels.buffer);

    for (let index = 0; index < character.bodyCells.length; index += 1) {
      const material = getCellMaterial(character.bodyCells[index]!);
      pixelWords[index] = MATERIAL_TEXTURE_PIXELS[material] ?? 0;
    }

    this.texture = new DataTexture(
      this.pixels,
      character.width,
      character.height,
      RGBAFormat,
      UnsignedByteType,
    );
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.needsUpdate = true;

    const geometry = new PlaneGeometry(character.width, character.height);
    const material = new MeshBasicMaterial({
      map: this.texture,
      transparent: true,
    });

    this.mesh = new Mesh(geometry, material);
    this.mesh.renderOrder = 1;
    this.update();
  }

  public update(): void {
    this.mesh.position.set(
      this.character.rigidBody.gridX + this.character.width / 2,
      this.character.rigidBody.gridY + this.character.height / 2,
      1,
    );
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}
