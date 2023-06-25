import { ControlProps, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type TextFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<string>


const parse: ControlValueParser<string, string> = value => value ?? null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * Renders a text field used for basic string editing and has no rich text editing capabilities.
 *
 * @group Form Fields
 */
export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, {
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return (
			<TextInput {...inputProps} />
		)
	},
	'TextField',
)
