export class Noise2D {
  public constructor(private readonly seed: number) {}

  public sample(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const localX = x - x0;
    const localY = y - y0;
    const u = fade(localX);
    const v = fade(localY);
    const top = lerp(
      this.gradient(x0, y0, localX, localY),
      this.gradient(x0 + 1, y0, localX - 1, localY),
      u,
    );
    const bottom = lerp(
      this.gradient(x0, y0 + 1, localX, localY - 1),
      this.gradient(x0 + 1, y0 + 1, localX - 1, localY - 1),
      u,
    );
    return lerp(top, bottom, v) * 1.41421356237;
  }

  public fractal(
    x: number,
    y: number,
    scale: number,
    octaves: number,
  ): number {
    let amplitude = 1;
    let frequency = 1 / scale;
    let total = 0;
    let weight = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      total += this.sample(x * frequency, y * frequency) * amplitude;
      weight += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / weight;
  }

  private gradient(
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
  ): number {
    const angle = this.hash(x, y) * Math.PI * 2;
    return Math.cos(angle) * offsetX + Math.sin(angle) * offsetY;
  }

  private hash(x: number, y: number): number {
    let value = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495);
    value ^= this.seed;
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
  }
}

function fade(value: number): number {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
