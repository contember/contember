import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { PolicyDto } from '../PolicyDto.js'
import { PolicyRow, rowToPolicy } from './rowMapping.js'

export class ListPoliciesQuery extends DatabaseQuery<PolicyDto[]> {
	async fetch(queryable: DatabaseQueryable): Promise<PolicyDto[]> {
		const rows = await SelectBuilder.create<PolicyRow>()
			.select('id').select('slug').select('label').select('description')
			.select('document').select('version')
			.select('created_at').select('updated_at')
			.from('tenant_policy')
			.orderBy('slug')
			.getResult(queryable.db)
		return rows.map(rowToPolicy)
	}
}
