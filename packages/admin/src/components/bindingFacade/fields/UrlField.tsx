import { UrlInput, UrlInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type UrlFieldProps = SimpleRelativeSingleFieldProps &
	Omit<UrlInputProps, 'value' | 'validationState' | 'allowNewlines' | 'wrapLines'>

const parse: ControlValueParser<string, string> = value => value ?? null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * @group Form Fields
 */
export const UrlField = SimpleRelativeSingleField<UrlFieldProps, string>(
	(fieldMetadata, {
		name,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <UrlInput {...inputProps} />
	},
	'UrlField',
)
