import WhereBuilder from '../select/WhereBuilder'
import { Input, Model } from '@contember/schema'
import UpdateBuilder from './UpdateBuilder'

class UpdateBuilderFactory {
	constructor(private readonly schema: Model.Schema, private readonly whereBuilder: WhereBuilder) {}

	public create(entity: Model.Entity, uniqueWhere: Input.Where): UpdateBuilder {
		return new UpdateBuilder(this.schema, entity, this.whereBuilder, uniqueWhere)
	}
}

export default UpdateBuilderFactory
