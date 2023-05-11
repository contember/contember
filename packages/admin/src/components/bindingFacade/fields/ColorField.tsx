import { ColorInput, ColorInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type ColorFieldProps = SimpleRelativeSingleFieldProps &
	Omit<ColorInputProps, 'value' | 'validationState' | 'allowNewlines' | 'wrapLines'>

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * @group Form Fields
 */
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

		return <ColorInput {...inputProps} />
	},
	'ColorField',
)
