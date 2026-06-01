import type { RawSchemaEntity } from './RawSchemaEntity.js'
import type { RawSchemaEnum } from './RawSchemaEnum.js'

export interface RawSchema {
	enums: RawSchemaEnum[]
	entities: RawSchemaEntity[]
}
