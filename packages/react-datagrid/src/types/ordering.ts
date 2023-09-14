import { DataGridColumnKey } from './column'
import { Environment, SugaredOrderBy } from '@contember/react-binding'

export type DataGridOrderDirection = 'asc' | 'desc' | null
export type DataGridSetOrderBy = (setOrderBy: DataGridOrderDirection | 'next', append?: boolean) => void
export type DataGridSetColumnOrderBy = (columnKey: DataGridColumnKey, columnOrderBy: DataGridOrderDirection | 'next', append?: boolean) => void

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataGridOrderDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined

export type DataGridOrderDirectionStore = Record<DataGridColumnKey, Exclude<DataGridOrderDirection, null>>
