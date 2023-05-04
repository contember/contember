import { EmailInput, EmailInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type EmailFieldProps = SimpleRelativeSingleFieldProps &
	Omit<EmailInputProps, 'value' | 'validationState' | 'allowNewlines' | 'wrapLines'>

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * @group Form Fields
 */
export const EmailField = SimpleRelativeSingleField<EmailFieldProps, string>(
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

		return <EmailInput {...inputProps} />
	},
	'EmailField',
)
