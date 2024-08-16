import type { EntityName, FieldName } from '../../treeParameters'
import { BindingError } from '../../BindingError'
import type { SchemaField } from './SchemaField'
import type { SchemaStore } from './SchemaStore'
import { SchemaEntity } from './SchemaEntity'
import { SchemaColumn } from './SchemaColumn'
import { SchemaRelation } from './SchemaRelation'
import { SchemaEnumName } from './SchemaEnums'

export class Schema {
	public constructor(private readonly store: SchemaStore) {}

	public getEnumValues(enumName: SchemaEnumName): string[] {
		return Array.from(this.store.enums.get(enumName) ?? this.throwError(`Missing schema for enum ${enumName}`))
	}

	public getEntityOrUndefined(entityName: EntityName): SchemaEntity | undefined {
		return this.store.entities.get(entityName)
	}

	public getEntityNames(): string[] {
		return Array.from(this.store.entities.keys())
	}

	public getEntity(entityName: EntityName): SchemaEntity {
		return this.getEntityOrUndefined(entityName) ?? this.throwError(`Missing schema for entity ${entityName}`)
	}

	public getEntityFieldOrUndefined(entityName: EntityName, fieldName: FieldName): SchemaField | undefined {
		return this.store.entities.get(entityName)?.fields.get(fieldName)
	}

	public getEntityField(entityName: EntityName, fieldName: FieldName): SchemaField {
		return this.getEntityFieldOrUndefined(entityName, fieldName) ?? this.throwError(`Missing schema for field ${entityName}.${fieldName}`)
	}

	public getEntityColumn(entityName: EntityName, fieldName: FieldName): SchemaColumn {
		const field = this.getEntityField(entityName, fieldName)
		return field.__typename === '_Column' ? field : this.throwError(`Field ${entityName}.${fieldName} is not of type column`)
	}

	public getEntityRelation(entityName: EntityName, fieldName: FieldName): SchemaRelation {
		const field = this.getEntityField(entityName, fieldName)
		return field.__typename === '_Relation' ? field : this.throwError(`Field ${entityName}.${fieldName} is not of type relation`)
	}

	private throwError(message: string): never {
		throw new BindingError(message)
	}
}
