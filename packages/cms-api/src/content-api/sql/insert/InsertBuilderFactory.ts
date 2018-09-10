import WhereBuilder from '../select/WhereBuilder'
import { Model } from 'cms-common'
import InsertBuilder from './InsertBuilder'
import KnexWrapper from '../../../core/knex/KnexWrapper'

class InsertBuilderFactory {
	constructor(private readonly schema: Model.Schema, private readonly whereBuilder: WhereBuilder) {}

	public create(entity: Model.Entity, db: KnexWrapper): InsertBuilder {
		return new InsertBuilder(this.schema, entity, db, this.whereBuilder)
	}
}

export default InsertBuilderFactory
