export type EntityId = number;

let nextEntityId = 1;

export abstract class Entity {
  public readonly id: EntityId = nextEntityId++;
}
