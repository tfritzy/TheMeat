export enum MaterialId {
  Empty = 0,
  Sand = 1,
  Water = 2,
  Stone = 3,
}

export enum MaterialBehavior {
  Empty = 0,
  Powder = 1,
  Liquid = 2,
  Static = 3,
}

export interface MaterialDefinition {
  readonly name: string;
  readonly behavior: MaterialBehavior;
  readonly density: number;
  readonly color: number;
  readonly opacity: number;
}

export const MATERIAL_DEFINITIONS: Readonly<
  Record<MaterialId, MaterialDefinition>
> = {
  [MaterialId.Empty]: {
    name: 'empty',
    behavior: MaterialBehavior.Empty,
    density: 0,
    color: 0x000000,
    opacity: 0,
  },
  [MaterialId.Sand]: {
    name: 'sand',
    behavior: MaterialBehavior.Powder,
    density: 160,
    color: 0xd6b25c,
    opacity: 1,
  },
  [MaterialId.Water]: {
    name: 'water',
    behavior: MaterialBehavior.Liquid,
    density: 80,
    color: 0x3f8fd2,
    opacity: 0.82,
  },
  [MaterialId.Stone]: {
    name: 'stone',
    behavior: MaterialBehavior.Static,
    density: 255,
    color: 0x5b6069,
    opacity: 1,
  },
};

export const MATERIAL_BEHAVIORS = new Uint8Array(256);
export const MATERIAL_DENSITIES = new Uint8Array(256);
const materialTextureBytes = new Uint8Array(256 * 4);
export const MATERIAL_TEXTURE_PIXELS = new Uint32Array(
  materialTextureBytes.buffer,
);

for (const materialText of Object.keys(MATERIAL_DEFINITIONS)) {
  const material = Number(materialText) as MaterialId;
  const definition = MATERIAL_DEFINITIONS[material];

  MATERIAL_BEHAVIORS[material] = definition.behavior;
  MATERIAL_DENSITIES[material] = definition.density;
  const pixelOffset = material * 4;
  materialTextureBytes[pixelOffset] = definition.color >>> 16;
  materialTextureBytes[pixelOffset + 1] = definition.color >>> 8;
  materialTextureBytes[pixelOffset + 2] = definition.color;
  materialTextureBytes[pixelOffset + 3] = definition.opacity * 255;
}
