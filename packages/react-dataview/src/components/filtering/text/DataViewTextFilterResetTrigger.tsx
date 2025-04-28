import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { useDataViewFilter } from '../../../hooks'
import { TextFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewTextFilterResetTriggerProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * The button element that triggers the reset action.
	 */
	children: ReactElement
}

/**
 * A trigger component to reset a text filter in a data view. If the filter is already unset (`query` is empty), the trigger will not render.
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewTextFilterResetTriggerProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewTextFilterResetTrigger>
 *     <button>Reset Filter</button>
 * </DataViewTextFilterResetTrigger>
 * ```
 */
export const DataViewTextFilterResetTrigger = forwardRef<HTMLButtonElement, DataViewTextFilterResetTriggerProps>(
	({ name, ...props }: DataViewTextFilterResetTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [state, setFilter] = useDataViewFilter<TextFilterArtifacts>(name)
		const resetFilter = useCallback(() => {
			setFilter(current => ({
				...current,
				query: '',
			}))
		}, [setFilter])

		// Don't render if the query is already empty
		if (!state?.query) {
			return null
		}

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<Slot
				ref={ref}
				onClick={composeEventHandlers(onClick, resetFilter)}
				{...otherProps}
			>
				{props.children}
			</Slot>
		)
	},
)

DataViewTextFilterResetTrigger.displayName = 'DataViewTextFilterResetTrigger'
