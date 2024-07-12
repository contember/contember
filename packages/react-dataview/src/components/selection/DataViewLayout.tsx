import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewDisplayedState, useDataViewSelectionState } from '../../contexts'
import { ReactNode } from 'react'

export interface DataViewLayoutProps {
	name: string
	label?: ReactNode
	children: ReactNode;
}

export const DataViewLayout = Component<DataViewLayoutProps>(({ name, children }) => {
	const selection = useDataViewDisplayedState().selection
	const value = selection?.values?.layout

	return !value || value === name ? <>{children}</> : null
}, ({ children, name }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.layout
	return !value || value === name ? children : null
})
