import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewSelectionState } from '../../contexts'

export interface DataViewHasLayoutProps {
	layout: string
	children: React.ReactNode;
}

export const DataViewHasLayout = Component<DataViewHasLayoutProps>(({ layout, children }) => {
	const selection = useDataViewSelectionState()
	const value = selection?.layout

	return value === layout ? <>{children}</> : null
}, ({ children, layout }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.layout
	return value === layout ? children : null
})
