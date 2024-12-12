import * as React from 'react'
import { forwardRef, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewTextFilterInput } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

const SlotInput = Slot as React.ForwardRefExoticComponent<
	React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>
>

export interface DataViewTextFilterInputProps {
	name?: string
	debounceMs?: number
	children: ReactElement
}

/**
 * A component for rendering an input field to filter data view by text.
 * Automatically binds the input to the text filter state in the data view and supports debouncing.
 *
 * ### Props
 * - **`name`**: The name of the filter. If not provided, the component will attempt to infer it from the context.
 * - **`debounceMs`**: The debounce time in milliseconds for the input value. Default is 500ms.
 * - **`children`**: The input element for the text filter.
 *
 * ### Example
 * ```tsx
 * <DataViewTextFilterInput debounceMs={300}>
 *     <input placeholder="Search..." />
 * </DataViewTextFilterInput>
 * ```
 */
export const DataViewTextFilterInput = forwardRef<HTMLInputElement, DataViewTextFilterInputProps>(
	({ name, debounceMs, ...props }: DataViewTextFilterInputProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()

		return (
			<SlotInput
				{...useDataViewTextFilterInput({ name, debounceMs })}
				{...props}
				ref={ref}
			/>
		)
	},
)

DataViewTextFilterInput.displayName = 'DataViewTextFilterInput'
