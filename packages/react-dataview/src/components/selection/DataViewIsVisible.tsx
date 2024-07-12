import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewDisplayedState } from '../../contexts'
import { ReactNode } from 'react'

export interface DataViewElementProps {
	name: string
	label?: ReactNode
	fallback?: boolean
	children: React.ReactNode;
}

export const DataViewElement = Component<DataViewElementProps>(({ name, fallback = true, children }) => {
	const selection = useDataViewDisplayedState()?.selection
	const value = selection?.values?.visibility?.[name] ?? fallback

	return value ? <>{children}</> : null
}, ({ children, fallback = true, name }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.visibility?.[name] ?? fallback
	return value ? children : null
})
