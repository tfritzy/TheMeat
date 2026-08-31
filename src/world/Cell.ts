import { MaterialId } from './Material';

export type PackedCell = number;

export function packCell(material: MaterialId): PackedCell {
  assertUnsignedByte(material, 'material');
  return material;
}

export function getCellMaterial(cell: PackedCell): MaterialId {
  return cell as MaterialId;
}

export const EMPTY_CELL = packCell(MaterialId.Empty);

function assertUnsignedByte(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be an integer from 0 to 255.`);
  }
}
