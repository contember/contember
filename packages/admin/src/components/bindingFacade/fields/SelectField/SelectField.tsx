import { Component, ErrorAccessor, FieldValue } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'
import { ChoiceField, ChoiceFieldData, DynamicSingleChoiceFieldProps, StaticSingleChoiceFieldProps } from '../ChoiceField'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'

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

export interface SelectFieldInnerPublicProps extends Omit<FormGroupProps, 'children'> {
	placeholder?: string
	allowNull?: boolean
	reactSelectProps?: Partial<SelectProps<any>>
}

export interface SelectFieldInnerProps extends ChoiceFieldData.SingleChoiceFieldMetadata, SelectFieldInnerPublicProps {
	errors: ErrorAccessor | undefined
}

const SelectFieldInner = memo(
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
		...formGroupProps
	}: SelectFieldInnerProps) => {
		const asyncProps = useCommonReactSelectAsyncProps({
			reactSelectProps,
			placeholder,
			data,
			isInvalid: (errors?.validation?.length ?? 0) > 0,
		})

		return (
			<FormGroup
				{...formGroupProps}
				errors={errors}
				label={environment.applySystemMiddleware('labelMiddleware', formGroupProps.label)}
			>
				<AsyncSelect
					{...asyncProps}
					isClearable={allowNull === true}
					value={data[currentValue]}
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
			</FormGroup>
		)
	},
)
