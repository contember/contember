import type { Environment, SugaredOrderBy } from '@contember/react-binding'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataGridOrderDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined
