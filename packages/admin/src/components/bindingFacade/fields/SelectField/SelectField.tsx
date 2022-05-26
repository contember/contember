import { Component, FieldValue } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'
import {
	ChoiceField,
	ChoiceFieldData,
	DynamicSingleChoiceFieldProps,
	StaticSingleChoiceFieldProps,
} from '../ChoiceField'
import { selectStyles } from './commonStyles'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'
import { useLabelMiddleware } from '../../environment/LabelMiddleware'

export type SelectFieldProps =
	& SelectFieldInnerPublicProps
	& (
		| StaticSingleChoiceFieldProps
		| DynamicSingleChoiceFieldProps
	)

export const SelectField: FunctionComponent<SelectFieldProps> = Component(
	props => (
		<ChoiceField {...props} >
			{({
				data,
				currentValue,
				onChange,
				errors,
				environment,
				isMutating,
			}: ChoiceFieldData.SingleChoiceFieldMetadata) => (
				<SelectFieldInner
					{...props}
					data={data}
					currentValue={currentValue}
					onChange={onChange}
					environment={environment}
					errors={errors}
					isMutating={isMutating}
				/>
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
		environment,
		errors,
		isMutating,
		onChange,
		reactSelectProps,
		...fieldContainerProps
	}: SelectFieldInnerProps) => {
		const asyncProps = useCommonReactSelectAsyncProps({
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
				<AsyncSelect
					{...asyncProps}
					isClearable={allowNull === true}
					value={data[currentValue]}
					styles={selectStyles as Object} // TODO: Too complex to fix styling related typesafety
					onChange={(newValue, actionMeta) => {
						const value = newValue as ChoiceFieldData.SingleDatum<FieldValue | undefined>
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
			</FieldContainer>
		)
	},
)
