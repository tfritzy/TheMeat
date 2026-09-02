export abstract class Character {
  public readonly bodyCells: Uint32Array;

  public constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    this.bodyCells = this.getInitialBodyCells();

    if (this.bodyCells.length !== width * height) {
      throw new RangeError("Character body dimensions do not match its cells.");
    }
  }

  public abstract getInitialBodyCells(): Uint32Array;
}
