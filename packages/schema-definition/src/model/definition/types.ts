import { EntityConstructor } from '../../utils'
import { FieldDefinition } from './fieldDefinitions'

export type RelationTarget = EntityConstructor
export type FieldsDefinition = Record<string, FieldDefinition<any>>
export { type EntityConstructor }
