import KnexWrapper from "../../../core/knex/KnexWrapper";
import WhereBuilder from "../select/WhereBuilder";
import { Model, Input } from 'cms-common'
import UpdateBuilder from "./UpdateBuilder";

class UpdateBuilderFactory {
	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
	) {
	}

	public create(entity: Model.Entity, db: KnexWrapper, uniqueWhere: Input.Where): UpdateBuilder {
		return new UpdateBuilder(this.schema, entity, db, this.whereBuilder, uniqueWhere)
	}
}


export default UpdateBuilderFactory
