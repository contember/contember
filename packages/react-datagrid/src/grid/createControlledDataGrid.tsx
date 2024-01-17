import { Component } from '@contember/react-binding'
import { ComponentType, useEffect } from 'react'
import { DataGridMethods, DataGridState } from '../types'
import { ControlledDataView, DataViewInfo } from '@contember/react-dataview'

export type ControlledDataGridProps =
	& {
	state: DataGridState<any>
	methods: DataGridMethods
	info: DataViewInfo
}

export const createControlledDataGrid = <P extends {}>(Renderer: ComponentType<P & ControlledDataGridProps>) => Component<ControlledDataGridProps & P>(({ state, methods, info, ...props }) => {
	const renderer = <Renderer state={state} methods={methods} info={info} {...props as P} />
	return (
		<ControlledDataView state={state} methods={methods} info={info} children={renderer}/>
	)
})
