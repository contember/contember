import { Component } from '@contember/react-binding'
import { ComponentType } from 'react'
import { DataGridColumns, DataGridMethods, DataGridState } from '../types'
import { ControlledDataView, DataViewInfo } from '@contember/react-dataview'

export type ControlledDataGridProps =
	& {
		state: DataGridState
		methods: DataGridMethods
		info: DataViewInfo
		columns: DataGridColumns<any>
	}

export const createControlledDataGrid = <P extends {}>(Renderer: ComponentType<P & ControlledDataGridProps>) => Component<ControlledDataGridProps & P>(({ state, methods, info, columns, ...props }) => {
	const renderer = <Renderer state={state} methods={methods} info={info} columns={columns} {...props as P} />
	return (
		<ControlledDataView state={state} methods={methods} info={info} children={renderer}/>
	)
})
