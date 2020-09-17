import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '@contember/binding'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type FloatFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>(
	(fieldMetadata, { defaultValue, ...props }) => {
		const generateOnChange = (data: FieldAccessor<number>) => (e: React.ChangeEvent<HTMLInputElement>) => {
			data.updateValue(parseFloat(e.target.value))
		}
		return (
			<TextInput
				value={
					typeof fieldMetadata.field.currentValue === 'number' ? fieldMetadata.field.currentValue.toString(10) : '0'
				}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors.length ? 'invalid' : undefined}
				{...props}
			/>
		)
	},
	'FloatField',
)
