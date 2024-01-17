import { ReactNode } from 'react'
import { Component } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks/useDataView'
import { ControlledDataView } from './ControlledDataView'


export type DataViewProps =
	& {
		children: ReactNode
	}
	& UseDataViewArgs

export const DataView = Component<DataViewProps>(props => {
	const { state, methods, info } = useDataView(props)

	return (
		<ControlledDataView state={state} methods={methods} info={info}>
			{props.children}
		</ControlledDataView>
	)
}, () => {
	return null
})
