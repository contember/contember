import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { useTextInput } from './useTextInput'

export type NumberFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const NumberField = SimpleRelativeSingleField<NumberFieldProps, number>(
	(fieldMetadata, { defaultValue, onBlur, ...props }) => {
		const inputProps = useTextInput<number>({
			fieldMetadata,
			onBlur,
			parse: value => parseInt(value, 10),
			format: value => (typeof value === 'number' ? value.toString(10) : '0'),
		})
		return <TextInput type="number" {...inputProps} {...props} />
	},
	'NumberField',
)
