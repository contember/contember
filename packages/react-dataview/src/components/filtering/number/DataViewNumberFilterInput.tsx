import * as React from 'react'
import { forwardRef, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewNumberFilterInput } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

const SlotInput = Slot as React.ForwardRefExoticComponent<
	React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>
>

export interface DataViewNumberFilterInputProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * Specifies whether the input corresponds to the `from` or `to` value of the numeric range.
	 */
	type: 'from' | 'to'
	/**
	 * Indicates whether floating-point numbers are allowed. Defaults to `false`.
	 */
	allowFloat?: boolean
	/**
	 * The input element for the number filter.
	 */
	children: ReactElement
}

/**
 * A component for rendering an input field to filter data view by numeric ranges.
 * Automatically binds the input to the number filter state in the data view.
 *
 * ## Props
 * - name, type, allowFloat, children
 *
 * See {@link DataViewNumberFilterInputProps} for details.
 *
 * #### Example
 * ```tsx
 * <DataViewNumberFilterInput type="from" allowFloat>
 *     <input placeholder="Minimum Value" />
 * </DataViewNumberFilterInput>
 * <DataViewNumberFilterInput type="to">
 *     <input placeholder="Maximum Value" />
 * </DataViewNumberFilterInput>
 * ```
 */
export const DataViewNumberFilterInput = forwardRef<HTMLInputElement, DataViewNumberFilterInputProps>(
	({ name, type, allowFloat, ...props }: DataViewNumberFilterInputProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()

		return (
			<SlotInput
				{...useDataViewNumberFilterInput({ name, type, allowFloat })}
				{...props}
				ref={ref}
			/>
		)
	},
)

DataViewNumberFilterInput.displayName = 'DataViewNumberFilterInput'
