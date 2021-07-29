import { FieldDefinition } from './fieldDefinitions'

export type Interface<T> = { [P in keyof T]: T[P] }
export type RelationTarget = EntityConstructor
export type EntityConstructor<T = any> = { new (): T }
export type DecoratorFunction<T> = (cls: EntityConstructor<T>) => void
export type FieldsDefinition = Record<string, Interface<FieldDefinition<any>>>
