import {
	DateInput,
	DateInputProps,
	toDateString,
	toISOString,
} from '@contember/ui'
import {
	SimpleRelativeSingleField,
	SimpleRelativeSingleFieldProps,
} from '../auxiliary'
import { useFieldControl } from './useFieldControl'

export type DateFieldProps = SimpleRelativeSingleFieldProps & DateInputProps

/**
 * @group Form Fields
 */
export const DateField = SimpleRelativeSingleField<DateFieldProps, string>(
	(fieldMetadata, props) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse: toISOString,
			format: toDateString,
		})

		return <DateInput {...inputProps} />
	},
	'DateField',
)
