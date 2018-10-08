import WhereBuilder from '../select/WhereBuilder'
import { Model } from 'cms-common'
import InsertBuilder from './InsertBuilder'
import KnexWrapper from '../../../core/knex/KnexWrapper'

class InsertBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly db: KnexWrapper
	) {}

	public create(entity: Model.Entity): InsertBuilder {
		return new InsertBuilder(this.schema, entity, this.db, this.whereBuilder)
	}
}

export default InsertBuilderFactory
