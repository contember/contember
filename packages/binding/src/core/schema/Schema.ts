import { EntityName, FieldName } from '../../treeParameters'
import { SchemaField } from './SchemaField'
import { SchemaStore } from './SchemaStore'

export class Schema {
	public constructor(public readonly store: SchemaStore) {}

	public getEntityField(entityName: EntityName, field: FieldName): SchemaField | undefined {
		return this.store.entities.get(entityName)?.fields.get(field)
	}
}
