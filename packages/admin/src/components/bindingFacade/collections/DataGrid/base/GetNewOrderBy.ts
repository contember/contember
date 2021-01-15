import { Environment, SugaredOrderBy } from '@contember/binding'
import { DataGridOrderDirection } from './DataGridOrderDirection'

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataGridOrderDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined
