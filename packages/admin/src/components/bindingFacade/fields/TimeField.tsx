import { TimeInput, TimeInputProps, toTimeString } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ControlValueParser, useFieldControl } from './useFieldControl'

export type TimeFieldProps = SimpleRelativeSingleFieldProps & TimeInputProps

const parse: ControlValueParser<string, string> = value => value ??  null

/**
 * @group Form Fields
 */
export const TimeField = SimpleRelativeSingleField<TimeFieldProps, string>(
	(fieldMetadata, props) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format: toTimeString,
		})

		return <TimeInput {...inputProps} />
	},
	'TimeField',
)
