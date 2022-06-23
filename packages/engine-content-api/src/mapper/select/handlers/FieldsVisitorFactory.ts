import { FieldsVisitor } from './FieldsVisitor.js'
import { RelationFetcher } from '../RelationFetcher.js'
import { Model } from '@contember/schema'
import { Mapper } from '../../Mapper.js'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler.js'
import { PredicateFactory } from '../../../acl/index.js'
import { WhereBuilder } from '../WhereBuilder.js'

export class FieldsVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
	) {}

	create(mapper: Mapper, context: SelectExecutionHandlerContext): FieldsVisitor {
		return new FieldsVisitor(
			this.schema,
			this.relationFetcher,
			this.predicateFactory,
			this.whereBuilder,
			mapper,
			context,
		)
	}
}
