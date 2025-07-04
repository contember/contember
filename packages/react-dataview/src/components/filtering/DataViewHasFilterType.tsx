import { useDataViewFilterHandlerRegistry } from '../../contexts'

export interface DataViewHasFilterTypeProps {

	/**
	 * The name of the filter type to check for.
	 */
	name: string

	/**
	 * The children to render if the filter type is registered.
	 */
	children: React.ReactNode
}

/**
 * Renders children only if a filter type with the given name is registered.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewHasFilterTypeProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewHasFilterType name="text">
 *     //  Filter controls here 
 * </DataViewHasFilterType>
 * ```
 */
export const DataViewHasFilterType = ({ name, children }: DataViewHasFilterTypeProps) => {
	const types = useDataViewFilterHandlerRegistry()
	return types[name] ? <>{children}</> : null
}
