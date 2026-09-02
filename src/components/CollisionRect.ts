export class CollisionRect {
  public constructor(
    public readonly offsetX: number,
    public readonly offsetY: number,
    public readonly width: number,
    public readonly height: number,
  ) {
    if (
      !Number.isFinite(offsetX) ||
      !Number.isFinite(offsetY) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new RangeError(
        "Collision rectangle must have finite values and positive dimensions.",
      );
    }
  }
}
