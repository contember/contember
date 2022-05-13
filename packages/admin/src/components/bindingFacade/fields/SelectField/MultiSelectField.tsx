import { Component } from '@contember/binding'
import { FieldContainer, FieldContainerProps, FieldErrors } from '@contember/ui'
import { FunctionComponent, memo } from 'react'
import type { Props as SelectProps } from 'react-select'
import AsyncSelect from 'react-select/async'
import { ChoiceFieldData, DynamicMultiChoiceField, DynamicMultipleChoiceFieldProps } from '../ChoiceField'
import { selectStyles } from './commonStyles'
import { useCommonReactSelectAsyncProps } from './useCommonReactSelectAsyncProps'

export type MultiSelectFieldProps =
	& MultiSelectFieldInnerPublicProps
	& DynamicMultipleChoiceFieldProps

export const MultiSelectField: FunctionComponent<MultiSelectFieldProps> = Component(
	props => (
		<DynamicMultiChoiceField {...props} >
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
		...fieldContainerProps
	}: MultiSelectFieldInnerProps) => {
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
				label={environment.applyLabelMiddleware(fieldContainerProps.label)}
			>
				<AsyncSelect
					{...asyncProps}
					isMulti
					isClearable
					closeMenuOnSelect={false}
					styles={selectStyles as Object} // TODO: Too complex to fix styling related typesafety
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
			</FieldContainer>
		)
	},
)
