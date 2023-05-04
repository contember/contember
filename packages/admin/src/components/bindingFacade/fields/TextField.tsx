import { ControlProps, TextareaInput, TextInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type TextFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<string>
	& {
		/**
		 * @deprecated Use TextareaField
		 */
		allowNewlines?: boolean
		/**
		 * @deprecated Use TextareaField
		 */
		wrapLines?: boolean
	}

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * Renders a text field used for basic string editing and has no rich text editing capabilities.
 *
 * @group Form Fields
 */
export const TextField = SimpleRelativeSingleField<TextFieldProps, string>(
	(fieldMetadata, {
		allowNewlines,
		label,
		wrapLines,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		if (import.meta.env.DEV && (allowNewlines || wrapLines)) {
			console.warn('Props `allowNewlines` and `wrapLines` are deprecated. Use TextareaField instead.')
		}

		return allowNewlines || wrapLines
			? <TextareaInput {...inputProps} />
			: <TextInput {...inputProps} />
	},
	'TextField',
)
