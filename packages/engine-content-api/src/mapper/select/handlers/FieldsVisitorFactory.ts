import { FieldsVisitor } from './FieldsVisitor.js'
import { RelationFetcher } from '../RelationFetcher.js'
import { Mapper } from '../../Mapper.js'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler.js'
import { PredicateFactory } from '../../../acl/index.js'
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
