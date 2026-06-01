import { DataViewFilterHandler } from '../../types/index.js'
import { DataViewFilterNameContext } from '../../contexts.js'
import { Component } from '@contember/react-binding'

export interface DataViewFilterProps {
	name: string
	filterHandler: DataViewFilterHandler<any>
	children?: React.ReactNode
}

/**
 * Registers a filter type with the given name and filter handler.
 *
 * ## Props
 * - name, filterHandler, children
 */
export const DataViewFilter = Component(({ name, children }: DataViewFilterProps) => {
	return (
		<DataViewFilterNameContext.Provider value={name}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}, () => null)
