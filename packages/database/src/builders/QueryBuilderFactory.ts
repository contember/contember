import { SelectBuilder } from './SelectBuilder'
import { InsertBuilder } from './InsertBuilder'
import { UpdateBuilder } from './UpdateBuilder'
import { DeleteBuilder } from './DeleteBuilder'

export class QueryBuilderFactory {
	static selectBuilder<Result = SelectBuilder.Result>(): SelectBuilder<Result, never> {
		return SelectBuilder.create<Result>()
	}

	static insertBuilder(): InsertBuilder.NewInsertBuilder {
		return InsertBuilder.create()
	}

	static updateBuilder(): UpdateBuilder.NewUpdateBuilder {
		return UpdateBuilder.create()
	}

	static deleteBuilder(): DeleteBuilder.NewDeleteBuilder {
		return DeleteBuilder.create()
	}
}
