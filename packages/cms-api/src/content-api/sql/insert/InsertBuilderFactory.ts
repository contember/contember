import WhereBuilder from '../select/WhereBuilder'
import { Model } from '@contember/schema'
import InsertBuilder from './InsertBuilder'
import Client from '../../../core/database/Client'

class InsertBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly db: Client,
	) {}

	public create(entity: Model.Entity): InsertBuilder {
		return new InsertBuilder(this.schema, entity, this.db, this.whereBuilder)
	}
}

export default InsertBuilderFactory
