import type { SchemaEntities } from './SchemaEntities.js'
import type { SchemaEnums } from './SchemaEnums.js'

// This should comprise of just structured-cloneable data structures.
export interface SchemaStore {
	enums: SchemaEnums
	entities: SchemaEntities
}
