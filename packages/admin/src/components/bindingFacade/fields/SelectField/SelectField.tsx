import { Component, ErrorAccessor, FieldValue } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import AsyncSelect from 'react-select/async'
import { Props as SelectProps } from 'react-select'

import { ChoiceField, ChoiceFieldData, DynamicSingleChoiceFieldProps, StaticChoiceFieldProps } from '../ChoiceField'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'

// TODO this is a bit of a mouthful. Express this more elegantly in order to avoid moving so much complexity to places like here.
export type SelectFieldProps = SelectFieldInnerPublicProps &
	(Omit<StaticChoiceFieldProps<'single'>, 'arity'> | DynamicSingleChoiceFieldProps)

export const SelectField = Component<SelectFieldProps>(
	props => (
		<ChoiceField {...props} arity="single">
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
	errors: ErrorAccessor[]
}

const SelectFieldInner = React.memo(
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
		})

		return (
			<FormGroup {...formGroupProps} label={environment.applySystemMiddleware('labelMiddleware', formGroupProps.label)}>
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
							case 'deselect-option':
							case 'set-value': {
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
