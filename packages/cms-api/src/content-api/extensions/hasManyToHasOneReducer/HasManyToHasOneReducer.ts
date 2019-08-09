import EntityFieldsProvider from '../EntityFieldsProvider'
import { acceptFieldVisitor } from '../../../content-schema/modelUtils'
import { Model } from '@contember/schema'
import HasManyToHasOneRelationReducerFieldVisitor from './HasManyToHasOneRelationReducerVisitor'

class HasManyToHasOneReducer implements EntityFieldsProvider<HasManyToHasOneReducer.Meta> {
	static extensionName: string = 'HasManyToHasOneReducer'

	constructor(
		private readonly schema: Model.Schema,
		private readonly visitor: HasManyToHasOneRelationReducerFieldVisitor,
	) {}

	getFields(entity: Model.Entity, fields: string[]): EntityFieldsProvider.FieldMap<HasManyToHasOneReducer.Meta> {
		return fields.reduce(
			(result, field) => ({ ...result, ...acceptFieldVisitor(this.schema, entity, field, this.visitor) }),
			{},
		)
	}
}

namespace HasManyToHasOneReducer {
	export interface Meta {
		relationName: string
	}
}

export default HasManyToHasOneReducer
