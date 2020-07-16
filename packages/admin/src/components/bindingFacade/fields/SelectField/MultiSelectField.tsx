import { Component, ErrorAccessor } from '@contember/binding'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'

import { ChoiceField, ChoiceFieldData, DynamicMultipleChoiceFieldProps, StaticChoiceFieldProps } from '../ChoiceField'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'

export type MultiSelectFieldProps = MultiSelectFieldInnerPublicProps &
	(Omit<StaticChoiceFieldProps<'multiple'>, 'arity'> | DynamicMultipleChoiceFieldProps)

export const MultiSelectField = Component<MultiSelectFieldProps>(
	props => (
		<ChoiceField {...props} arity="multiple">
			{({
				data,
				currentValues,
				onChange,
				errors,
				environment,
				isMutating,
				clear,
			}: ChoiceFieldData.MultipleChoiceFieldMetadata) => (
				<MultiSelectFieldInner
					{...props}
					data={data}
					currentValues={currentValues}
					onChange={onChange}
					environment={environment}
					errors={errors}
					isMutating={isMutating}
					clear={clear}
				/>
			)}
		</ChoiceField>
	),
	'MultiSelectField',
)

export interface MultiSelectFieldInnerPublicProps extends Omit<FormGroupProps, 'children'> {
	placeholder?: string
	reactSelectProps?: Partial<SelectProps<any>>
}

export interface MultiSelectFieldInnerProps
	extends ChoiceFieldData.MultipleChoiceFieldMetadata,
		MultiSelectFieldInnerPublicProps {
	errors: ErrorAccessor[]
}

const MultiSelectFieldInner = React.memo(
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
		...formGroupProps
	}: MultiSelectFieldInnerProps) => {
		const asyncProps = useCommonReactSelectAsyncProps({
			reactSelectProps,
			placeholder,
			data,
		})
		return (
			<FormGroup {...formGroupProps} label={environment.applySystemMiddleware('labelMiddleware', formGroupProps.label)}>
				<AsyncSelect
					{...asyncProps}
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
