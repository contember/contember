import type { FieldAccessor } from '@contember/binding'
import { TextInput, TextInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type TextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, ...props }) => {
		const generateOnChange = (data: FieldAccessor<string>): TextInputProps['onChange'] => e => {
			data.updateValue(!e.target.value && data.valueOnServer === null ? null : e.target.value)
		}
		return (
			<TextInput
				value={fieldMetadata.field.value || ''}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors ? 'invalid' : undefined}
				readOnly={fieldMetadata.isMutating}
				{...(props as any)} // This is VERY wrong.
			/>
		)
	},
	'TextField',
)
