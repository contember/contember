import FieldDefinition from './FieldDefinition'

export type Interface<T> = { [P in keyof T]: T[P] }
export type RelationTarget = EntityConstructor
export type EntityConstructor<T = any> = { new (): T }
