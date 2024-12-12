import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { useDataViewFilter } from '../../../hooks'
import { NumberRangeFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewNumberFilterResetTriggerProps = {
	name?: string
	children: ReactElement
}

/**
 * A trigger component to reset a number range filter in a data view.
 *
 * ### Props
 * - **`name`**: The name of the filter. If not provided, the component will attempt to infer it from the context.
 * - **`children`**: The button element that triggers the reset action.
 *
 * ### Behavior
 * - Resets the filter's `from` and `to` values to `undefined`.
 * - If the filter is already unset (both `from` and `to` are `undefined`), the trigger will not render.
 *
 * ### Example
 * ```tsx
 * <DataViewNumberFilterResetTrigger>
 *     <button>Reset Filter</button>
 * </DataViewNumberFilterResetTrigger>
 * ```
 */
export const DataViewNumberFilterResetTrigger = forwardRef<HTMLButtonElement, DataViewNumberFilterResetTriggerProps>(
	({ name, ...props }: DataViewNumberFilterResetTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [state, setFilter] = useDataViewFilter<NumberRangeFilterArtifacts>(name)
		const resetFilter = useCallback(() => {
			setFilter(current => ({
				...current,
				from: undefined,
				to: undefined,
			}))
		}, [setFilter])

		// Don't render if the filter is already unset
		if (state?.from === undefined && state?.to === undefined) {
			return null
		}

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<Slot
				ref={ref}
				onClick={composeEventHandlers(onClick, resetFilter)}
				{...otherProps}
			/>
		)
	},
)

DataViewNumberFilterResetTrigger.displayName = 'DataViewNumberFilterResetTrigger'
