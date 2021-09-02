import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { useTextInput } from './useTextInput'
import { useState } from 'react'

export type FloatFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>(
	(fieldMetadata, { defaultValue, onBlur, ...props }) => {
		const [innerValue, setInnerValue] = useState('')
		const inputProps = useTextInput<number>({
			fieldMetadata,
			onBlur,
			parse: val => {
				const normalizedValue = (val || '0')
					.replaceAll(',', '.')
					.replace(/([^0-9.]|\.(?=\d*\.))/g, '')
					.replace(/^0*(?=\d)/, '')
				setInnerValue(normalizedValue)
				return parseFloat(normalizedValue)
			},
			format: value =>
				innerValue && parseFloat(innerValue) === value
					? innerValue
					: typeof value === 'number'
					? value.toString(10)
					: '0',
		})
		return <TextInput {...inputProps} {...props} />
	},
	'FloatField',
)
