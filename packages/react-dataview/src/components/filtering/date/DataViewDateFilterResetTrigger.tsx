import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { useDataViewFilter } from '../../../hooks'
import { DateRangeFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>

export interface DataViewDateFilterResetTriggerProps {

	/**
	 * The name of the filter. If not provided, it will be inferred from the context
	 */
	name?: string

	/**
	 * Specifies which part of the date range to reset:
	 *  - `'start'`: Resets the start date.
	 *  - `'end'`: Resets the end date.
	 *  - `undefined`: Resets both start and end dates.
	 */
	type?: 'start' | 'end'

	/**
	 * The button element
	 */
	children: ReactElement
}

/**
 * A trigger component for resetting parts of a date range filter in a data view.
 * The trigger is rendered only if there is a start or end date to reset.
 *
 * ## Props
 * - name, type, children
 *
 * See {@link DataViewDateFilterResetTriggerProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilterResetTrigger type="start">
 *     <button>Reset Start Date</button>
 * </DataViewDateFilterResetTrigger>
 * ```
 */
export const DataViewDateFilterResetTrigger = forwardRef<HTMLButtonElement, DataViewDateFilterResetTriggerProps>(
	({ name, type, ...props }, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)

		const handleReset = useCallback(() => {
			setFilter(currentState => ({
				...currentState,
				start: !type || type === 'start' ? undefined : currentState?.start,
				end: !type || type === 'end' ? undefined : currentState?.end,
			}))
		}, [setFilter, type])

		const hasStart = state?.start !== undefined
		const hasEnd = state?.end !== undefined

		if ((!hasStart && !hasEnd) || (type === 'start' && !hasStart) || (type === 'end' && !hasEnd)) {
			return null
		}
		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, handleReset)}
				{...otherProps}
			/>
		)
	},
)

DataViewDateFilterResetTrigger.displayName = 'DataViewDateFilterResetTrigger'
