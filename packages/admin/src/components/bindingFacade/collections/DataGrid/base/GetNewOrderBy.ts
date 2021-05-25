import type { Environment, SugaredOrderBy } from '@contember/binding'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataGridOrderDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined
