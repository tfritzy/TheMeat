import { MaterialId } from './Material';

export type PackedCell = number;

// 31....28 27....24 23............16 15.............8 7..........0
// [ frac Y ][ frac X ][ velocity Y ][ velocity X ][ material ]
const BYTE_MASK = 0xff;
const NIBBLE_MASK = 0x0f;
const MATERIAL_MASK = BYTE_MASK;
const VELOCITY_X_SHIFT = 8;
const VELOCITY_Y_SHIFT = 16;
const FRACTION_X_SHIFT = 24;
const FRACTION_Y_SHIFT = 28;
const VELOCITY_X_MASK = BYTE_MASK << VELOCITY_X_SHIFT;
const VELOCITY_Y_MASK = BYTE_MASK << VELOCITY_Y_SHIFT;
const VELOCITY_MASK = VELOCITY_X_MASK | VELOCITY_Y_MASK;
const FRACTION_X_MASK = NIBBLE_MASK << FRACTION_X_SHIFT;
const FRACTION_Y_MASK = NIBBLE_MASK << FRACTION_Y_SHIFT;
const MOTION_MASK =
  VELOCITY_MASK | FRACTION_X_MASK | FRACTION_Y_MASK;

export const CELL_VELOCITY_SCALE = 16;

export function packCell(
  material: MaterialId,
  velocityX = 0,
  velocityY = 0,
): PackedCell {
  assertUnsignedByte(material, 'material');
  assertVelocity(velocityX, 'velocityX');
  assertVelocity(velocityY, 'velocityY');

  if (material === MaterialId.Empty) return 0;

  return withCellVelocityRawUnchecked(
    material,
    Math.round(velocityX * CELL_VELOCITY_SCALE),
    Math.round(velocityY * CELL_VELOCITY_SCALE),
  );
}

export function getCellMaterial(cell: PackedCell): MaterialId {
  return (cell & MATERIAL_MASK) as MaterialId;
}

export function getCellVelocityX(cell: PackedCell): number {
  return getCellVelocityXRaw(cell) / CELL_VELOCITY_SCALE;
}

export function getCellVelocityY(cell: PackedCell): number {
  return getCellVelocityYRaw(cell) / CELL_VELOCITY_SCALE;
}

export function getCellVelocityXRaw(cell: PackedCell): number {
  return decodeSignedByte(cell >>> VELOCITY_X_SHIFT);
}

export function getCellVelocityYRaw(cell: PackedCell): number {
  return decodeSignedByte(cell >>> VELOCITY_Y_SHIFT);
}

export function getCellFractionXRaw(cell: PackedCell): number {
  return decodeSignedNibble(cell >>> FRACTION_X_SHIFT);
}

export function getCellFractionYRaw(cell: PackedCell): number {
  return decodeSignedNibble(cell >>> FRACTION_Y_SHIFT);
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
  assertVelocity(velocityX, 'velocityX');
  assertVelocity(velocityY, 'velocityY');

  return withCellVelocityRawUnchecked(
    cell,
    Math.round(velocityX * CELL_VELOCITY_SCALE),
    Math.round(velocityY * CELL_VELOCITY_SCALE),
  );
}

/** Values outside the signed-byte range are intentionally truncated. */
export function withCellVelocityRawUnchecked(
  cell: PackedCell,
  velocityX: number,
  velocityY: number,
): PackedCell {
  return (
    (cell & ~VELOCITY_MASK) |
    ((velocityX & BYTE_MASK) << VELOCITY_X_SHIFT) |
    ((velocityY & BYTE_MASK) << VELOCITY_Y_SHIFT)
  ) >>> 0;
}

export function withCellMotionUnchecked(
  cell: PackedCell,
  velocityX: number,
  velocityY: number,
  fractionX: number,
  fractionY: number,
): PackedCell {
  return (
    (cell & ~MOTION_MASK) |
    ((velocityX & BYTE_MASK) << VELOCITY_X_SHIFT) |
    ((velocityY & BYTE_MASK) << VELOCITY_Y_SHIFT) |
    ((fractionX & NIBBLE_MASK) << FRACTION_X_SHIFT) |
    ((fractionY & NIBBLE_MASK) << FRACTION_Y_SHIFT)
  ) >>> 0;
}

export const EMPTY_CELL = packCell(MaterialId.Empty);

function decodeSignedNibble(value: number): number {
  const nibble = value & NIBBLE_MASK;
  return nibble > 7 ? nibble - 16 : nibble;
}

function decodeSignedByte(value: number): number {
  const byte = value & BYTE_MASK;
  return byte > 127 ? byte - 256 : byte;
}

function assertUnsignedByte(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be an integer from 0 to 255.`);
  }
}

function assertVelocity(value: number, name: string): void {
  if (!Number.isFinite(value) || value < -8 || value > 127 / 16) {
    throw new RangeError(`${name} must be from -8 to 7.9375.`);
  }
}
