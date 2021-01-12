import { Filter } from '@contember/binding'
import * as React from 'react'

const DataGridColumnFilterContext = React.createContext<Filter | undefined>(undefined)
export const useDataGridColumnFilter: <F extends Filter>() => F | undefined = <F extends Filter>(): F | undefined =>
	React.useContext(DataGridColumnFilterContext) as F | undefined
export const DataColumnFilterProvider: (props: {
	filter: Filter
	children: React.ReactNode
}) => React.ReactElement = (props: { filter: Filter; children: React.ReactNode }) => (
	<DataGridColumnFilterContext.Provider value={props.filter}>{props.children}</DataGridColumnFilterContext.Provider>
)
