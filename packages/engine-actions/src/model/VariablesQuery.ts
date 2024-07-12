import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'

export class VariablesQuery extends DatabaseQuery<VariableRow[]> {
	public async fetch(queryable: DatabaseQueryable): Promise<VariableRow[]> {
		return await SelectBuilder.create<VariableRow>()
			.from('actions_variable')
			.getResult(queryable.db)
	}
}

export type VariableRow = {
	id: string
	name: string
	value: string
	created_at: Date
	updated_at: Date
}
