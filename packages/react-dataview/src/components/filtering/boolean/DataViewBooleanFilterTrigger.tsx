import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { dataAttribute } from '@contember/utilities'
import { DataViewBooleanFilterCurrent, DataViewSetBooleanFilterAction, useDataViewBooleanFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewBooleanFilterTriggerAttributes {
	['data-active']?: ''
	['data-current']: DataViewBooleanFilterCurrent
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewBooleanFilterTriggerAttributes>

export interface DataViewBooleanFilterTriggerProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string

	/**
	 * Specifies the boolean value this button represents (e.g., typically one button for `true` and one for `false`).
	 */
	value: boolean

	/**
	 * Determines how the filter behaves when the button is clicked:
	 *   - `'include'`: Sets the filter to include the value.
	 *   - `'unset'`: Removes the filter.
	 *   - `'toggle'`: Toggles the filter state.
	 */
	action?: DataViewSetBooleanFilterAction

	/**
	 * The button element.
	 */
	children: ReactElement

}

/**
 *
 * A trigger component for managing boolean filters in a data view.
 *
 * ## Props
 * - name, value, action, children
 *
 * See {@link DataViewBooleanFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the `value` matches the current filter state.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The filter is active for the specified `value`.
 *   - `'none'`: The filter is not active.
 *
 * ## Example
 * ```tsx
 * <DataViewBooleanFilterTrigger value={true} action="toggle">
 *     <button>Include True</button>
 * </DataViewBooleanFilterTrigger>
 * ```
 */
export const DataViewBooleanFilterTrigger = forwardRef<HTMLButtonElement, DataViewBooleanFilterTriggerProps>(({ name, action = 'include', value, ...props }: DataViewBooleanFilterTriggerProps, ref) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [current, setFilter] = useDataViewBooleanFilter(name, value)
	const toggleFilter = useCallback(() => {
		setFilter(action)
	}, [action, setFilter])
	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return (
		<SlotType
			ref={ref}
			onClick={composeEventHandlers(onClick, toggleFilter)}
			data-active={dataAttribute(current === actionToState[action])}
			data-current={current}
			{...otherProps}
		/>
	)
})
DataViewBooleanFilterTrigger.displayName = 'DataViewBooleanFilterTrigger'

const actionToState: Record<DataViewSetBooleanFilterAction, DataViewBooleanFilterCurrent> = {
	include: 'include',
	unset: 'none',
	toggle: 'include',
}
