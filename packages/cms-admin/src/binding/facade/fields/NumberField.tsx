import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type NumberFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const NumberField = SimpleRelativeSingleField<NumberFieldProps, number>(
	(fieldMetadata, { defaultValue, ...props }) => {
		const generateOnChange = (data: FieldAccessor<number>) => (newValue: string) => {
			data.updateValue && data.updateValue(parseInt(newValue, 10))
		}
		return (
			<TextInput
				value={typeof fieldMetadata.data.currentValue === 'number' ? fieldMetadata.data.currentValue.toString(10) : '0'}
				onChange={generateOnChange(fieldMetadata.data)}
				validationState={fieldMetadata.errors.length ? 'invalid' : undefined}
				type="number"
				{...props}
			/>
		)
	},
	'NumberField',
)
