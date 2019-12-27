import WhereBuilder from '../select/WhereBuilder'
import { Model } from '@contember/schema'
import InsertBuilder from './InsertBuilder'

class InsertBuilderFactory {
	constructor(private readonly schema: Model.Schema, private readonly whereBuilder: WhereBuilder) {}

	public create(entity: Model.Entity): InsertBuilder {
		return new InsertBuilder(this.schema, entity, this.whereBuilder)
	}
}

export default InsertBuilderFactory
