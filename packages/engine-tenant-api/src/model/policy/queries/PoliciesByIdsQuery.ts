import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { PolicyDto } from '../PolicyDto'
import { PolicyRow, rowToPolicy } from './rowMapping'

export class PoliciesByIdsQuery extends DatabaseQuery<PolicyDto[]> {
	constructor(private readonly ids: readonly string[]) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<PolicyDto[]> {
		if (this.ids.length === 0) {
			return []
		}
		const rows = await SelectBuilder.create<PolicyRow>()
			.select('id').select('slug').select('label').select('description')
			.select('document').select('version')
			.select('created_at').select('updated_at')
			.from('tenant_policy')
			.where(expr => expr.in('id', [...this.ids]))
			.getResult(queryable.db)
		return rows.map(rowToPolicy)
	}
}
