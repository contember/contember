import KnexWrapper from '../../../core/knex/KnexWrapper'
import WhereBuilder from '../select/WhereBuilder'
import { Model, Input } from 'cms-common'
import UpdateBuilder from './UpdateBuilder'

class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly db: KnexWrapper
	) {}

	public create(entity: Model.Entity, uniqueWhere: Input.Where): UpdateBuilder {
		return new UpdateBuilder(this.schema, entity, this.db, this.whereBuilder, uniqueWhere)
	}
}

export default UpdateBuilderFactory
