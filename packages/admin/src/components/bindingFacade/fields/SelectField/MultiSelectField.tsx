import { Component } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors, SelectCreateNewWrapper } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'
import { ChoiceFieldData, DynamicMultiChoiceField, DynamicMultipleChoiceFieldProps } from '../ChoiceField'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'

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
		environment,
		errors,
		isMutating,
		onChange,
		clear,
		reactSelectProps,
		placeholder,
		onAddNew,
		...fieldContainerProps
	}: MultiSelectFieldInnerProps) => {
		const labelMiddleware = useLabelMiddleware()
		const asyncProps = useCommonReactSelectAsyncProps({
			reactSelectProps,
			placeholder,
			data,
			isInvalid: (errors?.length ?? 0) > 0,
		})
		return (
			<FieldContainer
				{...fieldContainerProps}
				errors={errors}
				label={labelMiddleware(fieldContainerProps.label)}
			>
				<SelectCreateNewWrapper onClick={onAddNew}>
					<AsyncSelect
						{...asyncProps}
						menuPlacement="auto"
						isMulti
						isClearable
						closeMenuOnSelect={false}
						value={Array.from(currentValues, key => data[key])}
						onChange={(newValues, actionMeta) => {
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
						}}
					/>
				</SelectCreateNewWrapper>
			</FieldContainer>
		)
	},
)
