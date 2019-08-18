import { TextInput, TextInputProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type FloatFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<number>) => (newValue: string) => {
		data.updateValue && data.updateValue(parseFloat(newValue))
	}
	return (
		<TextInput
			value={typeof fieldMetadata.data.currentValue === 'number' ? fieldMetadata.data.currentValue.toString(10) : '0'}
			onChange={generateOnChange(fieldMetadata.data)}
			validationState={fieldMetadata.errors.length ? 'invalid' : undefined}
			{...props}
		/>
	)
}, 'FloatField')
