import { RawSchemaEntity } from './RawSchemaEntity'
import { RawSchemaEnum } from './RawSchemaEnum'

export interface RawSchema {
	enums: RawSchemaEnum[]
	entities: RawSchemaEntity[]
}
