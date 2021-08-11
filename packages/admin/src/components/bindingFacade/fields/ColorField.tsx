import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { stringFieldParser, useTextInput } from './useTextInput'

export type ColorFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const ColorField = SimpleRelativeSingleField<ColorFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, onBlur, ...props }) => {
		const inputProps = useTextInput({
			fieldMetadata,
			onBlur,
			parse: stringFieldParser,
		})
		return <TextInput type="color" {...inputProps} {...props} />
	},
	'ColorField',
)
