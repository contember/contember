import { TextInput, TextInputProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type TextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, { defaultValue, ...props }) => {
		const generateOnChange = (data: FieldAccessor<string>): TextInputProps['onChange'] => e => {
			data.updateValue && data.updateValue(e.target.value)
		}
		return (
			<TextInput
				value={fieldMetadata.data.currentValue || ''}
				onChange={generateOnChange(fieldMetadata.data)}
				validationState={fieldMetadata.errors.length ? 'invalid' : undefined}
				{...(props as any)}
			/>
		)
	},
	'TextField',
)
