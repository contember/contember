import type { RawSchemaEntity } from './RawSchemaEntity'
import type { RawSchemaEnum } from './RawSchemaEnum'

export interface RawSchema {
	enums: RawSchemaEnum[]
	entities: RawSchemaEntity[]
}
