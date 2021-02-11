import { EntityName } from '../../treeParameters'
import { SchemaEntity } from './SchemaEntity'
import { SchemaEnums } from './SchemaEnums'

export type SchemaEntities = Map<EntityName, SchemaEntity>

export interface Schema {
	enums: SchemaEnums
	entities: SchemaEntities
}
