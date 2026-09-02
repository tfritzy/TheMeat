const POSITION_X = 0;
const POSITION_Y = 1;
const VELOCITY_X = 2;
const VELOCITY_Y = 3;
const GROUNDED = 4;

export class RigidBody {
  private readonly values = new Float64Array(5);

  public get positionX(): number {
    return this.values[POSITION_X]!;
  }

  public set positionX(value: number) {
    this.values[POSITION_X] = value;
  }

  public get positionY(): number {
    return this.values[POSITION_Y]!;
  }

  public set positionY(value: number) {
    this.values[POSITION_Y] = value;
  }

  public get velocityX(): number {
    return this.values[VELOCITY_X]!;
  }

  public set velocityX(value: number) {
    this.values[VELOCITY_X] = value;
  }

  public get velocityY(): number {
    return this.values[VELOCITY_Y]!;
  }

  public set velocityY(value: number) {
    this.values[VELOCITY_Y] = value;
  }

  public get isGrounded(): boolean {
    return this.values[GROUNDED] === 1;
  }

  public set isGrounded(value: boolean) {
    this.values[GROUNDED] = Number(value);
  }

  public get gridX(): number {
    return Math.floor(this.positionX);
  }

  public get gridY(): number {
    return Math.floor(this.positionY);
  }

  public setPosition(x: number, y: number): void {
    this.positionX = x;
    this.positionY = y;
  }
}
