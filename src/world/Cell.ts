import { MaterialId } from './Material';

export type PackedCell = number;

//  31                    8 7              0
// ┌───────────────────────┬────────────────┐
// │     reserved (24)     │  material (8)  │
// └───────────────────────┴────────────────┘
export const CELL_MATERIAL_MASK = 0x000000ff;
export const CELL_RESERVED_MASK = 0xffffff00;

export function packCell(material: MaterialId): PackedCell {
  assertUnsignedByte(material, 'material');
  return material >>> 0;
}

export function getCellMaterial(cell: PackedCell): MaterialId {
  return (cell & CELL_MATERIAL_MASK) as MaterialId;
}

export function setCellMaterial(
  cell: PackedCell,
  material: MaterialId,
): PackedCell {
  assertUnsignedByte(material, 'material');
  return ((cell & CELL_RESERVED_MASK) | material) >>> 0;
}

export const EMPTY_CELL = packCell(MaterialId.Empty);

function assertUnsignedByte(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be an integer from 0 to 255.`);
  }
}
