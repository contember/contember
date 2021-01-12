import { OrderBy } from '@contember/binding'
import * as React from 'react'

const DataGridColumnOrderByContext = React.createContext<OrderBy | undefined>(undefined)
export const useDataGridColumnOrderBy: <O extends OrderBy>() => O | undefined = <O extends OrderBy>(): O | undefined =>
	React.useContext(DataGridColumnOrderByContext) as O | undefined
export const DataColumnOrderByProvider: (props: {
	orderBy: OrderBy
	children: React.ReactNode
}) => React.ReactElement = (props: { orderBy: OrderBy; children: React.ReactNode }) => (
	<DataGridColumnOrderByContext.Provider value={props.orderBy}>{props.children}</DataGridColumnOrderByContext.Provider>
)
