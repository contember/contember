import type { EntityName, FieldName } from '../../treeParameters'
import type { SchemaField } from './SchemaField'
import type { SchemaStore } from './SchemaStore'
import { SchemaEntity } from './SchemaEntity'

export class Schema {
	public constructor(public readonly store: SchemaStore) {}

	public getEntity(entityName: EntityName): SchemaEntity | undefined {
		return this.store.entities.get(entityName)
	}

	public getEntityField(entityName: EntityName, field: FieldName): SchemaField | undefined {
		return this.store.entities.get(entityName)?.fields.get(field)
	}
}
