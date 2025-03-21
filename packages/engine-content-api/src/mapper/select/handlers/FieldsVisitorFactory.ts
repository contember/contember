import { FieldsVisitor } from './FieldsVisitor'
import { RelationFetcher } from '../RelationFetcher'
import { Mapper } from '../../Mapper'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler'
import { PredicateFactory } from '../../../acl'
import { Model, Settings } from '@contember/schema'
import { Providers } from '@contember/schema-utils'

export class FieldsVisitorFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly settings: Settings.ContentSettings,
		private readonly providers: Providers,
	) {}

	create(mapper: Mapper, context: SelectExecutionHandlerContext): FieldsVisitor {
		return new FieldsVisitor(
			this.schema,
			this.relationFetcher,
			this.predicateFactory,
			mapper,
			context,
			context.relationPath,
			this.settings,
			this.providers,
		)
	}
}
