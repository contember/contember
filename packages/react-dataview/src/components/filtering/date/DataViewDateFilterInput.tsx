import * as React from 'react'
import { forwardRef, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewDateFilterInput } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

const SlotInput = Slot as React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>

export interface DataViewDateFilterInputProps {

	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string

	/**
	 * Specifies whether the input corresponds to the `start` or `end` of the date range.
	 */
	type: 'start' | 'end'

	/**
	 * The input element for the date filter.
	 */
	children: ReactElement
}

/**
 * A component for rendering an input field to filter data view by date range.
 * Automatically binds the input to the date filter state in the data view.
 *
 * ## Props
 * - name, type, children
 *
 * See {@link DataViewDateFilterInputProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewDateFilterInput type="start">
 *     <input placeholder="Start Date" />
 * </DataViewDateFilterInput>
 * <DataViewDateFilterInput type="end">
 *     <input placeholder="End Date" />
 * </DataViewDateFilterInput>
 * ```
 */
export const DataViewDateFilterInput = forwardRef<HTMLInputElement, DataViewDateFilterInputProps>(
	({ name, type, ...props }: DataViewDateFilterInputProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()

		return (
			<SlotInput
				{...useDataViewDateFilterInput({ name, type })}
				{...props}
				ref={ref}
			/>
		)
	},
)

DataViewDateFilterInput.displayName = 'DataViewDateFilterInput'
