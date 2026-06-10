import { Policy } from '@contember/policy'
import { PolicyDto } from '../PolicyDto.js'

export interface PolicyRow {
	id: string
	slug: string
	label: string
	description: string | null
	document: Policy
	version: number
	created_at: Date
	updated_at: Date
}

export function rowToPolicy(row: PolicyRow): PolicyDto {
	return {
		id: row.id,
		slug: row.slug,
		label: row.label,
		description: row.description,
		document: row.document,
		version: row.version,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	}
}
