import { PathFactory, WhereBuilder } from '../select'
import { Input, Model } from '@contember/schema'
import { UpdateBuilder } from './UpdateBuilder'

export class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
	) {}

	public create(entity: Model.Entity, uniqueWhere: Input.Where): UpdateBuilder {
		return new UpdateBuilder(this.schema, entity, this.whereBuilder, uniqueWhere, this.pathFactory)
	}
}
