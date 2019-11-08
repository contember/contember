import FieldDefinition from './FieldDefinition'

export type Interface<T> = { [P in keyof T]: T[P] }
export type RelationTarget = EntityConstructor<EntityType<any>>
export type EntityType<T> = { [K in keyof T]: Interface<FieldDefinition<any>> }
export type EntityConstructor<T> = { new (): T }
