import { TextInput, TextInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { stringFieldParser, useTextInput } from './useTextInput'

export type TextFieldProps =
	& SimpleRelativeSingleFieldProps
	& Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>
	& {
		wrapLines?: boolean
	}

const removeNewLines = (text: string) => text.replace(/[\r\n]/g, '')

export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, onBlur, wrapLines = false, allowNewlines = false, ...props }) => {
		const inputProps = useTextInput({
			fieldMetadata,
			onBlur,
			parse: wrapLines && !allowNewlines ? removeNewLines : stringFieldParser,
		})
		return (
			<TextInput
				allowNewlines={allowNewlines || wrapLines}
				{...inputProps}
				{...(props as any)} // This is VERY wrong.
			/>
		)
	},
	'TextField',
)
