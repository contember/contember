import EntityFieldsProvider from '../EntityFieldsProvider'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import HasManyToHasOneRelationReducerFieldVisitor from './HasManyToHasOneRelationReducerVisitor'

class HasManyToHasOneReducer implements EntityFieldsProvider<HasManyToHasOneReducer.Extension> {
	static extensionName: string = 'HasManyToHasOneReducer'

	constructor(
		private readonly schema: Model.Schema,
		private readonly visitor: HasManyToHasOneRelationReducerFieldVisitor,
	) {}

	getFields(entity: Model.Entity, fields: string[]): EntityFieldsProvider.FieldMap<HasManyToHasOneReducer.Extension> {
		return fields.reduce(
			(result, field) => ({ ...result, ...acceptFieldVisitor(this.schema, entity, field, this.visitor) }),
			{},
		)
	}
}

namespace HasManyToHasOneReducer {
	export interface Extension {
		relationName: string
	}
}

export default HasManyToHasOneReducer
