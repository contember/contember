import type { SchemaEntities } from './SchemaEntities'
import type { SchemaEnums } from './SchemaEnums'

// This should comprise of just structured-cloneable data structures.
export interface SchemaStore {
	enums: SchemaEnums
	entities: SchemaEntities
}
