import { EntityConstructor } from '../../utils/index.js'
import { FieldDefinition } from './fieldDefinitions/index.js'

export type RelationTarget = EntityConstructor
export type FieldsDefinition = Record<string, FieldDefinition<any>>
export type { EntityConstructor }
