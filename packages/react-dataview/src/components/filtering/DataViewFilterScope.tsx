import { DataViewFilterNameContext } from '../../contexts'

export interface DataViewFilterScopeProps {
	/**
	 * The name of the filter.
	 */
	name: string
	children: React.ReactNode
}

/**
 * Sets the name of the filter for all children.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewFilterScopeProps} for details.
 */
export const DataViewFilterScope = ({ name, children }: DataViewFilterScopeProps) => {
	return (
		<DataViewFilterNameContext.Provider value={name}>
			{children}
		</DataViewFilterNameContext.Provider>
	)
}
