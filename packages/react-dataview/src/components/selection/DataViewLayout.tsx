import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewDisplayedState } from '../../contexts'
import { ReactNode } from 'react'

export interface DataViewLayoutProps {
	/**
	 * The name of the layout.
	 */
	name: string

	/**
	 * Label of the layout. Collected during static-render process and might be used e.g. for layout switcher.
	 */
	label?: ReactNode

	/**
	 * The content to render if the layout is active.
	 */
	children: ReactNode
}

/**
 * Conditionally renders its children based on the current layout state of a data view.
 *
 * ## Props
 * - name, label, children
 *
 * See {@link DataViewLayoutProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewLayout name={'grid'} label="Grid">
 *     //  Grid layout content here 
 * </DataViewLayout>
 * ```
 */
export const DataViewLayout = Component<DataViewLayoutProps>(({ name, children }) => {
	const selection = useDataViewDisplayedState()?.selection
	const value = selection?.values?.layout

	return !value || value === name ? <>{children}</> : null
}, ({ children, name }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.layout
	return !value || value === name ? children : null
})
