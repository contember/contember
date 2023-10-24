import { EntityFieldsProvider, FieldMap } from '../EntityFieldsProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { HasManyToHasOneRelationReducerFieldVisitor } from './HasManyToHasOneRelationReducerVisitor'

export class HasManyToHasOneReducer implements EntityFieldsProvider<HasManyToHasOneReducerExtension> {
	static extensionName: string = 'HasManyToHasOneReducer'

	constructor(
		private readonly schema: Model.Schema,
		private readonly visitor: HasManyToHasOneRelationReducerFieldVisitor,
	) {}

	getFields(entity: Model.Entity, accessibleFields: Model.AnyField[]): FieldMap<HasManyToHasOneReducerExtension> {
		const fieldMap: FieldMap<HasManyToHasOneReducerExtension> = {}
		for (const field of accessibleFields) {
			if (field.type !== Model.RelationType.OneHasMany) {
				continue
			}

			for (const [name, resultField] of acceptFieldVisitor(this.schema, entity, field, this.visitor)) {
				fieldMap[name] = resultField
			}
		}
		return fieldMap
	}
}

export interface HasManyToHasOneReducerExtension {
	relationName: string
}
