import type { EntityName, FieldName } from '../treeParameters/index.js'
import type { SchemaField } from './SchemaField.js'
import type { SchemaStore } from './SchemaStore.js'
import { SchemaEntity } from './SchemaEntity.js'
import { SchemaColumn } from './SchemaColumn.js'
import { SchemaRelation } from './SchemaRelation.js'
import { SchemaEnumName } from './SchemaEnums.js'
import { throwBindingError } from '../BindingError.js'

export class Schema {
	public constructor(private readonly store: SchemaStore) {}

	public getEnumNames(): string[] {
		return Array.from(this.store.enums.keys())
	}

	public getEnumValues(enumName: SchemaEnumName): string[] {
		return Array.from(this.store.enums.get(enumName) ?? throwBindingError(`Missing schema for enum ${enumName}`))
	}

	public getEntityOrUndefined(entityName: EntityName): SchemaEntity | undefined {
		return this.store.entities.get(entityName)
	}

	public getEntityNames(): string[] {
		return Array.from(this.store.entities.keys())
	}

	public getEntity(entityName: EntityName): SchemaEntity {
		return this.getEntityOrUndefined(entityName) ?? throwBindingError(`Missing schema for entity ${entityName}`)
	}

	public getEntityFieldOrUndefined(entityName: EntityName, fieldName: FieldName): SchemaField | undefined {
		return this.store.entities.get(entityName)?.fields.get(fieldName)
	}

	public getEntityField(entityName: EntityName, fieldName: FieldName): SchemaField {
		return this.getEntityFieldOrUndefined(entityName, fieldName) ?? throwBindingError(`Missing schema for field ${entityName}.${fieldName}`)
	}

	public getEntityColumn(entityName: EntityName, fieldName: FieldName): SchemaColumn {
		const field = this.getEntityField(entityName, fieldName)
		return field.__typename === '_Column' ? field : throwBindingError(`Field ${entityName}.${fieldName} is not of type column`)
	}

	public getEntityRelation(entityName: EntityName, fieldName: FieldName): SchemaRelation {
		const field = this.getEntityField(entityName, fieldName)
		return field.__typename === '_Relation' ? field : throwBindingError(`Field ${entityName}.${fieldName} is not of type relation`)
	}
}
