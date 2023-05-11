import { ControlProps, TextareaInput, TextareaInputOwnProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type TextareaFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<string>
	& TextareaInputOwnProps

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * Renders a multiline text area field. It is used for basic string editing and has no rich text editing capabilities.
 *
 * @group Form Fields
 */
export const TextareaField = SimpleRelativeSingleField<TextareaFieldProps, string>(
	(fieldMetadata, {
		label,
		minRows,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <TextareaInput {...inputProps} minRows={minRows || 3} />
	},
	'TextareaField',
)

// TODO: Remove after depreciation period
/**
 * @deprecated Use `TextareaField` instead
 */
export const TextAreaField = SimpleRelativeSingleField<TextareaFieldProps, string>(
	(fieldMetadata, {
		label,
		minRows,
		...props
	}) => {
		if (import.meta.env.DEV) {
			console.warn('TextAreaField is deprecated. Plese use TextareaField to align with HTML/UI naming of components')
		}

		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <TextareaInput {...inputProps} minRows={minRows || 3} />
	},
	'TextAreaField',
)
