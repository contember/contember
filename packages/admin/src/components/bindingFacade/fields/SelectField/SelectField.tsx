import { Component } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors, SelectCreateNewWrapper } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import Select from 'react-select'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'
import {
	ChoiceField,
	ChoiceFieldData,
	DynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from '../ChoiceField'
import { useCommonReactSelectProps } from './useCommonReactSelectProps'

export type SelectFieldProps =
	& SelectFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

export const SelectField: FunctionComponent<SelectFieldProps> = Component(
	props => (
		<ChoiceField {...props} >
			{(choiceProps: ChoiceFieldData.SingleChoiceFieldMetadata) => (
				<SelectFieldInner {...props}{...choiceProps} />
			)}
		</ChoiceField>
	),
	'SelectField',
)

export interface SelectFieldInnerPublicProps extends Omit<FieldContainerProps, 'children'> {
	placeholder?: string
	allowNull?: boolean
	reactSelectProps?: Partial<SelectProps<any>>
}

export interface SelectFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, SelectFieldInnerPublicProps {
	errors: FieldErrors | undefined

}

export const SelectFieldInner = memo(
	({
		placeholder,
		allowNull,
		currentValue,
		data,
		errors,
		onChange,
		reactSelectProps,
		onAddNew,
		...fieldContainerProps
	}: SelectFieldInnerProps) => {
		const selectProps = useCommonReactSelectProps({
			reactSelectProps,
			placeholder,
			data,
			isInvalid: (errors?.length ?? 0) > 0,
		})

		const labelMiddleware = useLabelMiddleware()

		return (
			<FieldContainer
				{...fieldContainerProps}
				errors={errors}
				label={labelMiddleware(fieldContainerProps.label)}
			>
				<SelectCreateNewWrapper onClick={onAddNew}>
					<Select
						{...selectProps}
						menuPlacement="auto"
						isClearable={allowNull === true}
						value={data[currentValue]}
						onChange={(newValue, actionMeta) => {
							const value = newValue as ChoiceFieldData.SingleDatum
							switch (actionMeta.action) {
								case 'select-option': {
									onChange(value.key)
									break
								}
								case 'clear': {
									onChange(-1)
									break
								}
								case 'create-option': {
									// TODO not yet supported
									break
								}
								case 'remove-value':
								case 'pop-value':
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
