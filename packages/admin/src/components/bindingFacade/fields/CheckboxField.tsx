import { Checkbox, ControlProps } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

const parse: ControlValueParser<boolean, boolean> = value => value ?? null
const format: FieldValueFormatter<boolean, boolean> = value => value ?? null

export type CheckboxFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<boolean>

/**
 * @group Form Fields
 */
export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps, boolean>(
	(fieldMetadata, props) => {
		const inputProps = useFieldControl<boolean, boolean>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <Checkbox {...inputProps} />
	},
	'CheckboxField',
	{ labelPosition: 'labelInlineRight' },
)
