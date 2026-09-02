import { CollisionRect } from "../components/CollisionRect";
import { CharacterController } from "../controllers/CharacterController";
import { EMPTY_CELL, packCell } from "./Cell";
import { MaterialId } from "./Material";
import { Character } from "./Character";

export const PLAYER_WIDTH = 4;
export const PLAYER_HEIGHT = 8;

const FLESH_CELL = packCell(MaterialId.Flesh);

export class Player extends Character {
  public readonly controller: CharacterController;

  public constructor() {
    super(PLAYER_WIDTH, PLAYER_HEIGHT, new CollisionRect(1, 0, 3, 8), 2);
    this.controller = new CharacterController(this, {
      moveSpeed: 80,
      groundAcceleration: 640,
      groundDeceleration: 800,
      airAcceleration: 480,
      airDeceleration: 240,
      jumpVelocity: 72,
      jumpReleaseMultiplier: 0.45,
      coyoteSeconds: 0.1,
      jumpBufferSeconds: 0.12,
    });
  }

  public getInitialBodyCells(): Uint32Array {
    return new Uint32Array([
      EMPTY_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      FLESH_CELL,
      EMPTY_CELL,
      FLESH_CELL,
      FLESH_CELL,
      FLESH_CELL,
    ]);
  }
}
