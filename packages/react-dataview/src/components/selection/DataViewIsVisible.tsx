import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewSelectionState } from '../../contexts'

export interface DataViewIsVisibleProps {
	name: string
	fallback?: boolean
	children: React.ReactNode;
}

export const DataViewIsVisible = Component<DataViewIsVisibleProps>(({ name, fallback = true, children }) => {
	const selection = useDataViewSelectionState()
	const value = selection?.visibility?.[name] ?? fallback

	return value ? <>{children}</> : null
}, ({ children, fallback = true, name }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.visibility?.[name] ?? fallback
	return value ? children : null
})
