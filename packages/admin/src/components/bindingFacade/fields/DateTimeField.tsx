import { SimpleRelativeSingleField } from '../auxiliary'
import { DateFieldInner, DateFieldProps } from './DateField'

export type DateTimeFieldProps = Omit<DateFieldProps, 'showTimeSelect'>

export const DateTimeField = SimpleRelativeSingleField<DateTimeFieldProps, string>(
	(fieldMetadata, { ...props }) => {
		return <DateFieldInner fieldMetadata={fieldMetadata} {...props} showTimeSelect />
	},
	'DateTimeField',
)
