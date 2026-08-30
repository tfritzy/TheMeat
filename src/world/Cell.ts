import { MaterialId } from './Material';

export type PackedCell = number;

// 31......................16 15.....12 11......8 7..........0
// [        reserved        ][ vel Y ][ vel X ][ material ]
const BYTE_MASK = 0xff;
const NIBBLE_MASK = 0x0f;
const MATERIAL_MASK = BYTE_MASK;
const VELOCITY_X_SHIFT = 8;
const VELOCITY_Y_SHIFT = 12;
const VELOCITY_X_MASK = NIBBLE_MASK << VELOCITY_X_SHIFT;
const VELOCITY_Y_MASK = NIBBLE_MASK << VELOCITY_Y_SHIFT;
const VELOCITY_MASK = VELOCITY_X_MASK | VELOCITY_Y_MASK;

export function packCell(
  material: MaterialId,
  velocityX = 0,
  velocityY = 0,
): PackedCell {
  assertUnsignedByte(material, 'material');
  assertSignedNibble(velocityX, 'velocityX');
  assertSignedNibble(velocityY, 'velocityY');

  if (material === MaterialId.Empty) return 0;

  return (
    material |
    ((velocityX & NIBBLE_MASK) << VELOCITY_X_SHIFT) |
    ((velocityY & NIBBLE_MASK) << VELOCITY_Y_SHIFT)
  ) >>> 0;
}

export function getCellMaterial(cell: PackedCell): MaterialId {
  return (cell & MATERIAL_MASK) as MaterialId;
}

export function getCellVelocityX(cell: PackedCell): number {
  return decodeSignedNibble(cell >>> VELOCITY_X_SHIFT);
}

export function getCellVelocityY(cell: PackedCell): number {
  return decodeSignedNibble(cell >>> VELOCITY_Y_SHIFT);
}

export function withCellMaterial(
  cell: PackedCell,
  material: MaterialId,
): PackedCell {
  assertUnsignedByte(material, 'material');
  if (material === MaterialId.Empty) return EMPTY_CELL;
  return ((cell & ~MATERIAL_MASK) | material) >>> 0;
}

export function withCellVelocity(
  cell: PackedCell,
  velocityX: number,
  velocityY: number,
): PackedCell {
  assertSignedNibble(velocityX, 'velocityX');
  assertSignedNibble(velocityY, 'velocityY');

  return (
    (cell & ~VELOCITY_MASK) |
    ((velocityX & NIBBLE_MASK) << VELOCITY_X_SHIFT) |
    ((velocityY & NIBBLE_MASK) << VELOCITY_Y_SHIFT)
  ) >>> 0;
}

/**
 * Hot-path variant for simulation code that already owns the velocity bounds.
 * Values outside the signed-nibble range are intentionally truncated.
 */
export function withCellVelocityUnchecked(
  cell: PackedCell,
  velocityX: number,
  velocityY: number,
): PackedCell {
  return (
    (cell & ~VELOCITY_MASK) |
    ((velocityX & NIBBLE_MASK) << VELOCITY_X_SHIFT) |
    ((velocityY & NIBBLE_MASK) << VELOCITY_Y_SHIFT)
  ) >>> 0;
}

export const EMPTY_CELL = packCell(MaterialId.Empty);

function decodeSignedNibble(value: number): number {
  const nibble = value & NIBBLE_MASK;
  return nibble > 7 ? nibble - 16 : nibble;
}

function assertUnsignedByte(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be an integer from 0 to 255.`);
  }
}

function assertSignedNibble(value: number, name: string): void {
  if (!Number.isInteger(value) || value < -8 || value > 7) {
    throw new RangeError(`${name} must be an integer from -8 to 7.`);
  }
}
