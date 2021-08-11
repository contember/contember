import { TextInput, TextInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { stringFieldParser, useTextInput } from './useTextInput'

export type TextFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, onBlur, ...props }) => {
		const inputProps = useTextInput({
			fieldMetadata,
			onBlur,
			parse: stringFieldParser,
		})
		return (
			<TextInput
				{...inputProps}
				{...(props as any)} // This is VERY wrong.
			/>
		)
	},
	'TextField',
)
