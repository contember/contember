import { FieldDefinition } from './fieldDefinitions'
import { EntityConstructor } from '../../utils'

export type Interface<T> = { [P in keyof T]: T[P] }
export type RelationTarget = EntityConstructor
export type FieldsDefinition = Record<string, Interface<FieldDefinition<any>>>
export { EntityConstructor }
