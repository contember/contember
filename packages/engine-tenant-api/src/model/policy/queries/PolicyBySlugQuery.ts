import { DatabaseQuery, DatabaseQueryable, SelectBuilder } from '@contember/database'
import { PolicyDto } from '../PolicyDto'
import { PolicyRow, rowToPolicy } from './rowMapping'

export class PolicyBySlugQuery extends DatabaseQuery<PolicyDto | null> {
	constructor(private readonly slug: string) {
		super()
	}

	async fetch(queryable: DatabaseQueryable): Promise<PolicyDto | null> {
		const rows = await SelectBuilder.create<PolicyRow>()
			.select('id').select('slug').select('label').select('description')
			.select('document').select('version')
			.select('created_at').select('updated_at')
			.from('tenant_policy')
			.where({ slug: this.slug })
			.getResult(queryable.db)
		return rows.length === 0 ? null : rowToPolicy(rows[0])
	}
}
