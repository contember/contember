import { Component } from '@contember/react-binding'
import { dataViewSelectionEnvironmentExtension } from '../../env/dataViewSelectionEnvironmentExtension'
import { useDataViewDisplayedState } from '../../contexts'
import { ReactNode } from 'react'

export interface DataViewElementProps {
	/**
	 * The name of the data view element.
	 */
	name: string
	/**
	 * Label of the element. Collected during static-render process and might be used e.g. for visibility toggle.
	 */
	label?: ReactNode

	/**
	 * Determines whether to use the fallback value if the element visibility is not defined.
	 */
	fallback?: boolean

	/**
	 * The content to render if the element is visible.
	 */
	children: React.ReactNode
}

/**
 * Conditionally renders its children based on the current visibility state of a data view element.
 *
 *
 * ## Props
 * - name, fallback, children
 *
 * See {@link DataViewElementProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewElement name={'category'} label="Category">
 *     //  Category content here 
 * </DataViewElement>
 * ```
 */
export const DataViewElement = Component<DataViewElementProps>(({ name, fallback = true, children }) => {
	const selection = useDataViewDisplayedState()?.selection
	const value = selection?.values?.visibility?.[name] ?? fallback

	return value ? <>{children}</> : null
}, ({ children, fallback = true, name }, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)
	const value = selection?.visibility?.[name] ?? fallback
	return value ? children : null
})
