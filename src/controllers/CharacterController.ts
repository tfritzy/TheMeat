import { Character } from "../world/Character";

export interface CharacterControllerSettings {
  readonly moveSpeed: number;
  readonly groundAcceleration: number;
  readonly groundDeceleration: number;
  readonly airAcceleration: number;
  readonly airDeceleration: number;
  readonly jumpVelocity: number;
  readonly jumpReleaseMultiplier: number;
  readonly coyoteSeconds: number;
  readonly jumpBufferSeconds: number;
}

export class CharacterController {
  private moveLeft = false;
  private moveRight = false;
  private jumpHeld = false;
  private jumpReleased = false;
  private coyoteSeconds = 0;
  private jumpBufferSeconds = 0;

  public constructor(
    private readonly character: Character,
    private readonly settings: CharacterControllerSettings,
  ) {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  public update(deltaSeconds: number): void {
    const body = this.character.rigidBody;
    const direction = Number(this.moveRight) - Number(this.moveLeft);

    if (body.isGrounded) {
      this.coyoteSeconds = this.settings.coyoteSeconds;
    } else {
      this.coyoteSeconds = Math.max(0, this.coyoteSeconds - deltaSeconds);
    }

    this.jumpBufferSeconds = this.jumpHeld
      ? this.settings.jumpBufferSeconds
      : Math.max(0, this.jumpBufferSeconds - deltaSeconds);

    if (direction !== 0) {
      const acceleration = body.isGrounded
        ? this.settings.groundAcceleration
        : this.settings.airAcceleration;
      body.velocityX = moveToward(
        body.velocityX,
        direction * this.settings.moveSpeed,
        acceleration * deltaSeconds,
      );
    } else {
      body.velocityX = moveToward(
        body.velocityX,
        0,
        (body.isGrounded
          ? this.settings.groundDeceleration
          : this.settings.airDeceleration) * deltaSeconds,
      );
    }

    if (this.jumpBufferSeconds > 0 && this.coyoteSeconds > 0) {
      body.velocityY = this.settings.jumpVelocity;
      body.isGrounded = false;
      this.jumpBufferSeconds = 0;
      this.coyoteSeconds = 0;
    }

    if (this.jumpReleased && body.velocityY > 0) {
      body.velocityY *= this.settings.jumpReleaseMultiplier;
    }

    this.jumpReleased = false;
  }

  public dispose(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      this.moveLeft = true;
    } else if (event.code === "KeyD" || event.code === "ArrowRight") {
      this.moveRight = true;
    } else if (isJumpKey(event.code)) {
      if (!this.jumpHeld) {
        this.jumpBufferSeconds = this.settings.jumpBufferSeconds;
      }
      this.jumpHeld = true;
    } else {
      return;
    }

    event.preventDefault();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === "KeyA" || event.code === "ArrowLeft") {
      this.moveLeft = false;
    } else if (event.code === "KeyD" || event.code === "ArrowRight") {
      this.moveRight = false;
    } else if (isJumpKey(event.code)) {
      this.jumpHeld = false;
      this.jumpReleased = true;
    } else {
      return;
    }

    event.preventDefault();
  };
}

function isJumpKey(code: string): boolean {
  return code === "Space";
}

function moveToward(current: number, target: number, maximumDelta: number): number {
  if (current < target) return Math.min(current + maximumDelta, target);
  if (current > target) return Math.max(current - maximumDelta, target);
  return target;
}
