import {
	DateTimeInput,
	DateTimeInputProps,
	toDatetimeString,
	toISOString,
} from '@contember/ui'
import {
	SimpleRelativeSingleField,
	SimpleRelativeSingleFieldProps,
} from '../auxiliary'
import { useFieldControl } from './useFieldControl'

export type DateTimeFieldProps = SimpleRelativeSingleFieldProps & DateTimeInputProps

/**
 * @group Form Fields
 */
export const DateTimeField = SimpleRelativeSingleField<DateTimeFieldProps, string>(
	(fieldMetadata, props) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse: toISOString,
			format: toDatetimeString,
		})

		return <DateTimeInput {...inputProps} />
	},
	'DateTimeField',
)
