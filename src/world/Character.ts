import { CollisionRect } from "../components/CollisionRect";
import { RigidBody } from "../components/RigidBody";
import { Entity } from "./Entity";

export abstract class Character extends Entity {
  public readonly bodyCells: Uint32Array;
  public readonly rigidBody = new RigidBody();

  public constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly collisionRect: CollisionRect,
    public readonly maximumStepHeight: number,
  ) {
    super();
    this.bodyCells = this.getInitialBodyCells();

    if (this.bodyCells.length !== width * height) {
      throw new RangeError("Character body dimensions do not match its cells.");
    }
  }

  public abstract getInitialBodyCells(): Uint32Array;
}
