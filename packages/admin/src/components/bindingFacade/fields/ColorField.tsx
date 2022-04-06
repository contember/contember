import { TextInput, TextInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type ColorFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'validationState' | 'allowNewlines' | 'wrapLines'>

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

export const ColorField = SimpleRelativeSingleField<ColorFieldProps, string>(
	(fieldMetadata, {
		defaultValue,
		name,
		label,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <TextInput {...inputProps} />
	},
	'ColorField',
)
