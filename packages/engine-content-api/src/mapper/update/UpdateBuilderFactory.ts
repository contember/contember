import { PathFactory, WhereBuilder } from '../select/index.js'
import { Input, Model } from '@contember/schema'
import { UpdateBuilder } from './UpdateBuilder.js'
import { AclScope, PredicateFactory } from '../../acl/index.js'

export class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public create(entity: Model.Entity, primary: Input.PrimaryValue, scope: AclScope): UpdateBuilder {
		return new UpdateBuilder(
			this.schema,
			entity,
			this.whereBuilder,
			primary,
			this.pathFactory,
			this.predicateFactory,
			scope,
		)
	}
}
