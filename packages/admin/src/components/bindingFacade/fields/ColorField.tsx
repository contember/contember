import { FieldAccessor } from '@contember/binding'
import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { ChangeEvent } from 'react'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type ColorFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const ColorField = SimpleRelativeSingleField<ColorFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, ...props }) => {
		const generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
			data.updateValue(!e.target.value && data.valueOnServer === null ? null : e.target.value)
		}
		return (
			<TextInput
				value={fieldMetadata.field.value || ''}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors ? 'invalid' : undefined}
				readOnly={fieldMetadata.isMutating}
				type="color"
				{...props}
			/>
		)
	},
	'ColorField',
)
