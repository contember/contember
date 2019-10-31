import { TextInput, TextInputProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '../../../binding'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type TextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, ...props }) => {
		const generateOnChange = (data: FieldAccessor<string>): TextInputProps['onChange'] => e => {
			data.updateValue && data.updateValue(!e.target.value && data.persistedValue === null ? null : e.target.value)
		}
		return (
			<TextInput
				value={fieldMetadata.data.currentValue || ''}
				onChange={generateOnChange(fieldMetadata.data)}
				validationState={fieldMetadata.errors.length ? 'invalid' : undefined}
				readOnly={fieldMetadata.isMutating}
				{...(props as any)} // This is VERY wrong.
			/>
		)
	},
	'TextField',
)
