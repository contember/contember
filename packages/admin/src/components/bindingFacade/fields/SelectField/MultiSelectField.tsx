import { Component } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors, SelectCreateNewWrapper } from '@contember/ui'
import { FunctionComponent, memo, MouseEventHandler, useCallback } from 'react'
import type { MultiValueGenericProps, MultiValueProps, Props as SelectProps } from 'react-select'
import { ActionMeta, components } from 'react-select'
import AsyncSelect, { AsyncProps } from 'react-select/async'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'
import { ChoiceFieldData, DynamicMultiChoiceField, DynamicMultipleChoiceFieldProps } from '../ChoiceField'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'
import {
	HelperContainerGetter,
	SortableContainer,
	SortableContainerProps,
	SortableElement,
	SortableHandle,
	SortEndHandler,
} from 'react-sortable-hoc'

export type MultiSelectFieldProps =
	& MultiSelectFieldInnerPublicProps
	& DynamicMultipleChoiceFieldProps

export const MultiSelectField: FunctionComponent<MultiSelectFieldProps> = Component(
	props => (
		<DynamicMultiChoiceField {...props} >
			{(choiceProps: ChoiceFieldData.MultipleChoiceFieldMetadata) => (
				<MultiSelectFieldInner {...props} {...choiceProps} />
			)}
		</DynamicMultiChoiceField>
	),
	'MultiSelectField',
)

export interface MultiSelectFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'> {
	placeholder?: string
	reactSelectProps?: Partial<SelectProps<any>>
}

export interface MultiSelectFieldInnerProps
	extends ChoiceFieldData.MultipleChoiceFieldMetadata,
		MultiSelectFieldInnerPublicProps {
	errors: FieldErrors | undefined
}

export const MultiSelectFieldInner = memo(
	({
		currentValues,
		data,
		errors,
		onChange,
		clear,
		reactSelectProps,
		placeholder,
		onAddNew,
		onMove,
		...fieldContainerProps
	}: MultiSelectFieldInnerProps) => {
		const labelMiddleware = useLabelMiddleware()
		const asyncProps = useCommonReactSelectAsyncProps({
			reactSelectProps,
			placeholder,
			data,
			isInvalid: (errors?.length ?? 0) > 0,
		})

		const selectOnChange = useCallback((newValue: unknown, actionMeta: ActionMeta<ChoiceFieldData.SingleDatum>) => {
			switch (actionMeta.action) {
				case 'select-option': {
					onChange(actionMeta.option!.key, true)
					break
				}
				case 'remove-value': {
					onChange(actionMeta.removedValue!.key, false)
					break
				}
				case 'pop-value': {
					if (currentValues.length > 0) {
						onChange(currentValues[currentValues.length - 1], false)
					}
					break
				}
				case 'clear': {
					clear()
					break
				}
				case 'create-option': {
					// TODO not yet supported
					break
				}
				case 'deselect-option': {
					// When is this even called? 🤔
					break
				}
			}
		}, [clear, currentValues, onChange])

		const allAsyncSelectProps: AsyncProps<ChoiceFieldData.SingleDatum, boolean, never> = {
			...asyncProps,
			isMulti: true,
			isClearable: true,
			closeMenuOnSelect: false,
			value: Array.from(currentValues, key => data[key]),
			onChange: selectOnChange,
		}
		const onSortEnd = useCallback<SortEndHandler>(({ oldIndex, newIndex }) => {
			onMove?.(oldIndex, newIndex)
		}, [onMove])

		return (
			<FieldContainer
				{...fieldContainerProps}
				errors={errors}
				label={labelMiddleware(fieldContainerProps.label)}
			>
				<SelectCreateNewWrapper onClick={onAddNew}>
					{onMove
						? <SortableSelect
							{...allAsyncSelectProps}
							useDragHandle
							axis="xy"
							onSortEnd={onSortEnd}
							distance={4}
							helperContainer={getHelperContainer}
							helperClass={'sortable-dragged'}
							components={{
								...asyncProps.components,
								MultiValue: SortableMultiValue,
								MultiValueLabel: SortableMultiValueLabel,
							}}
						/>
						: <AsyncSelect {...allAsyncSelectProps}/>
					}
				</SelectCreateNewWrapper>
			</FieldContainer>
		)
	},
)

const getHelperContainer: HelperContainerGetter = () => {
	return document.getElementById('portal-root') ?? document.body
}


const SortableSelect = SortableContainer(AsyncSelect) as React.ComponentClass<SelectProps<ChoiceFieldData.SingleDatum, boolean, never> & SortableContainerProps>
const SortableMultiValue = SortableElement(
	(props: MultiValueProps<any, boolean, never>) => {
		// this prevents the menu from being opened/closed when the user clicks
		// on a value to begin dragging it. ideally, detecting a click (instead of
		// a drag) would still focus the control and toggle the menu, but that
		// requires some magic with refs that are out of scope for this example
		const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
			e.preventDefault()
			e.stopPropagation()
		}
		const innerProps = { ...props.innerProps, onMouseDown }
		return <components.MultiValue {...props} innerProps={innerProps} />
	},
)

const SortableMultiValueLabel = SortableHandle(
	(props: MultiValueGenericProps<any, boolean, never>) => <components.MultiValueLabel {...props} />,
)
