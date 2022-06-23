import { EntityFieldsProvider, FieldMap } from '../EntityFieldsProvider.js'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { HasManyToHasOneRelationReducerFieldVisitor } from './HasManyToHasOneRelationReducerVisitor.js'

export class HasManyToHasOneReducer implements EntityFieldsProvider<HasManyToHasOneReducerExtension> {
	static extensionName: string = 'HasManyToHasOneReducer'

	constructor(
		private readonly schema: Model.Schema,
		private readonly visitor: HasManyToHasOneRelationReducerFieldVisitor,
	) {}

	getFields(entity: Model.Entity, fields: string[]): FieldMap<HasManyToHasOneReducerExtension> {
		return fields.reduce(
			(result, field) => ({ ...result, ...acceptFieldVisitor(this.schema, entity, field, this.visitor) }),
			{},
		)
	}
}

export interface HasManyToHasOneReducerExtension {
	relationName: string
}
