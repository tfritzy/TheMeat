import { Character } from "../world/Character";
import { COLLISION_EPSILON, GRAVITY_ACCELERATION } from "../world/constants";
import {
  MATERIAL_BEHAVIORS,
  MaterialBehavior,
} from "../world/Material";
import { World } from "../world/World";

export class CharacterPhysics {
  public constructor(private readonly world: World) {}

  public update(deltaSeconds: number): void {
    for (const character of this.world.characters.values()) {
      const body = character.rigidBody;
      const canStepUp = body.isGrounded;
      body.isGrounded = false;
      body.velocityY += GRAVITY_ACCELERATION * deltaSeconds;
      this.moveCharacter(
        character,
        body.velocityX * deltaSeconds,
        body.velocityY * deltaSeconds,
        canStepUp,
      );
    }
  }

  private isSolid(worldX: number, worldY: number): boolean {
    const behavior = MATERIAL_BEHAVIORS[this.world.getMaterial(worldX, worldY)];
    return (
      behavior === MaterialBehavior.Powder ||
      behavior === MaterialBehavior.Static
    );
  }

  private moveCharacter(
    character: Character,
    deltaX: number,
    deltaY: number,
    wasGrounded: boolean,
  ): void {
    const stepCount = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY))),
    );
    const stepX = deltaX / stepCount;
    const stepY = deltaY / stepCount;
    let canStepUp = wasGrounded;
    let remainingStepHeight = character.maximumStepHeight;

    for (let step = 0; step < stepCount; step += 1) {
      if (stepX !== 0) {
        const steppedHeight = this.moveCharacterX(
          character,
          stepX,
          canStepUp ? remainingStepHeight : 0,
        );
        remainingStepHeight -= steppedHeight;
        canStepUp ||= steppedHeight > 0;
      }
      if (stepY !== 0) this.moveCharacterY(character, stepY);
      canStepUp ||= character.rigidBody.isGrounded;
    }
  }

  private moveCharacterX(
    character: Character,
    deltaX: number,
    maximumStepHeight: number,
  ): number {
    const body = character.rigidBody;
    const rect = character.collisionRect;
    body.positionX += deltaX;
    const minimumX = Math.floor(
      body.positionX + rect.offsetX + COLLISION_EPSILON,
    );
    const maximumX = Math.floor(
      body.positionX + rect.offsetX + rect.width - COLLISION_EPSILON,
    );
    const minimumY = Math.floor(
      body.positionY + rect.offsetY + COLLISION_EPSILON,
    );
    const maximumY = Math.floor(
      body.positionY + rect.offsetY + rect.height - COLLISION_EPSILON,
    );
    let collisionX: number | undefined;

    for (let y = minimumY; y <= maximumY; y += 1) {
      for (let x = minimumX; x <= maximumX; x += 1) {
        if (!this.isSolid(x, y)) continue;
        collisionX =
          collisionX === undefined
            ? x
            : deltaX > 0
              ? Math.min(collisionX, x)
              : Math.max(collisionX, x);
      }
    }

    if (collisionX === undefined) return 0;
    const steppedHeight = this.tryStepUp(character, maximumStepHeight);
    if (steppedHeight > 0) return steppedHeight;

    body.positionX =
      deltaX > 0
        ? collisionX - rect.offsetX - rect.width
        : collisionX + 1 - rect.offsetX;
    body.velocityX = 0;
    return 0;
  }

  private tryStepUp(
    character: Character,
    maximumStepHeight: number,
  ): number {
    const body = character.rigidBody;

    for (let height = 1; height <= maximumStepHeight; height += 1) {
      if (this.characterOverlapsSolid(character, body.positionY + height)) {
        continue;
      }
      body.positionY += height;
      return height;
    }

    return 0;
  }

  private characterOverlapsSolid(
    character: Character,
    positionY: number,
  ): boolean {
    const body = character.rigidBody;
    const rect = character.collisionRect;
    const minimumX = Math.floor(
      body.positionX + rect.offsetX + COLLISION_EPSILON,
    );
    const maximumX = Math.floor(
      body.positionX + rect.offsetX + rect.width - COLLISION_EPSILON,
    );
    const minimumY = Math.floor(
      positionY + rect.offsetY + COLLISION_EPSILON,
    );
    const maximumY = Math.floor(
      positionY + rect.offsetY + rect.height - COLLISION_EPSILON,
    );

    for (let y = minimumY; y <= maximumY; y += 1) {
      for (let x = minimumX; x <= maximumX; x += 1) {
        if (this.isSolid(x, y)) return true;
      }
    }

    return false;
  }

  private moveCharacterY(character: Character, deltaY: number): void {
    const body = character.rigidBody;
    const rect = character.collisionRect;
    body.positionY += deltaY;
    const minimumX = Math.floor(
      body.positionX + rect.offsetX + COLLISION_EPSILON,
    );
    const maximumX = Math.floor(
      body.positionX + rect.offsetX + rect.width - COLLISION_EPSILON,
    );
    const minimumY = Math.floor(
      body.positionY + rect.offsetY + COLLISION_EPSILON,
    );
    const maximumY = Math.floor(
      body.positionY + rect.offsetY + rect.height - COLLISION_EPSILON,
    );
    let collisionY: number | undefined;

    for (let y = minimumY; y <= maximumY; y += 1) {
      for (let x = minimumX; x <= maximumX; x += 1) {
        if (!this.isSolid(x, y)) continue;
        collisionY =
          collisionY === undefined
            ? y
            : deltaY > 0
              ? Math.min(collisionY, y)
              : Math.max(collisionY, y);
      }
    }

    if (collisionY === undefined) return;
    body.positionY =
      deltaY > 0
        ? collisionY - rect.offsetY - rect.height
        : collisionY + 1 - rect.offsetY;
    body.velocityY = 0;
    body.isGrounded = deltaY < 0;
  }
}
