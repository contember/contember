import { DataViewFilterHandler } from '../../types'
import { DataViewFilterNameContext } from '../../contexts'
import { Component } from '@contember/react-binding'

export type DataViewFilterProps = {
	name: string
	filterHandler: DataViewFilterHandler<any>
	children?: React.ReactNode
}
export const DataViewFilter = Component(({ name, children }: DataViewFilterProps) => {
	return <DataViewFilterNameContext.Provider value={name}>
		{children}
	</DataViewFilterNameContext.Provider>
}, () => null)
