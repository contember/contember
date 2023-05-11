import { SearchInput, SearchInputProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type SearchFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SearchInputProps, 'value' | 'validationState' | 'allowNewlines' | 'wrapLines'>

const parse: ControlValueParser<string, string> = value => value ??  null
const format: FieldValueFormatter<string, string> = value => value ?? null

/**
 * @group Form Fields
 */
export const SearchField = SimpleRelativeSingleField<SearchFieldProps, string>(
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

		return <SearchInput {...inputProps} />
	},
	'SearchField',
)
