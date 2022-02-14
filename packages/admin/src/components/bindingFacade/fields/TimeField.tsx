import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { stringFieldParser, useTextInput } from './useTextInput'

export type TimeFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const TimeField = SimpleRelativeSingleField<TimeFieldProps, string>(
	(fieldMetadata, { defaultValue, name, label, onBlur, ...props }) => {
		const inputProps = useTextInput({
			fieldMetadata,
			onBlur,
			parse: stringFieldParser,
		})
		return <TextInput type="time" {...inputProps} {...props} />
	},
	'TimeField',
)
