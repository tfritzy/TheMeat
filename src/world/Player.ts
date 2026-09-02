import { EMPTY_CELL, packCell, type PackedCell } from "./Cell";
import { MaterialId } from "./Material";
import { Character } from "./Character";

export const PLAYER_WIDTH = 4;
export const PLAYER_HEIGHT = 8;

const PLAYER_SPRITE = [
  ".HHH",
  ".HHS",
  ".HES",
  "..S.",
  ".CCC",
  ".CCS",
  ".CC.",
  ".O.O",
] as const;

const SKIN_CELL = packCell(MaterialId.Skin);
const CLOTH_CELL = packCell(MaterialId.Cloth);
const HAIR_CELL = packCell(MaterialId.Hair);
const EYE_CELL = packCell(MaterialId.Eye);
const SHOE_CELL = packCell(MaterialId.Shoe);

export class Player extends Character {
  public constructor() {
    super(PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  public getInitialBodyCells(): Uint32Array {
    const cells = new Uint32Array(PLAYER_WIDTH * PLAYER_HEIGHT);

    for (let topY = 0; topY < PLAYER_HEIGHT; topY += 1) {
      const row = PLAYER_SPRITE[topY]!;
      const localY = PLAYER_HEIGHT - topY - 1;
      const rowOffset = localY * PLAYER_WIDTH;

      for (let localX = 0; localX < PLAYER_WIDTH; localX += 1) {
        cells[rowOffset + localX] = getSpriteCell(row.charCodeAt(localX));
      }
    }

    return cells;
  }
}

function getSpriteCell(code: number): PackedCell {
  switch (code) {
    case 67:
      return CLOTH_CELL;
    case 69:
      return EYE_CELL;
    case 72:
      return HAIR_CELL;
    case 79:
      return SHOE_CELL;
    case 83:
      return SKIN_CELL;
    default:
      return EMPTY_CELL;
  }
}
