import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { useTextInput } from './useTextInput'

export type FloatFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>(
	(fieldMetadata, { defaultValue, onBlur, ...props }) => {
		const inputProps = useTextInput<number>({
			fieldMetadata,
			onBlur,
			parse: parseFloat,
			format: value => (typeof value === 'number' ? value.toString(10) : '0'),
		})
		return <TextInput {...inputProps} {...props} />
	},
	'FloatField',
)
