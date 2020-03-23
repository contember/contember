import { TextInput, SingleLineTextInputProps } from '@contember/ui'
import * as React from 'react'
import { FieldAccessor } from '@contember/binding'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type ColorFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const ColorField = SimpleRelativeSingleField<ColorFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, ...props }) => {
		const generateOnChange = (data: FieldAccessor<string>) => (e: React.ChangeEvent<HTMLInputElement>) => {
			data.updateValue && data.updateValue(!e.target.value && data.persistedValue === null ? null : e.target.value)
		}
		return (
			<TextInput
				value={fieldMetadata.field.currentValue || ''}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors.length ? 'invalid' : undefined}
				readOnly={fieldMetadata.isMutating}
				type="color"
				{...props}
			/>
		)
	},
	'ColorField',
)
