import { DateFieldProps, DateFieldInner } from './DateField'
import { SimpleRelativeSingleField } from '../auxiliary'

export type DateTimeFieldProps = Omit<DateFieldProps, 'showTimeSelect'>

export const DateTimeField = SimpleRelativeSingleField<DateTimeFieldProps, string>(
	(fieldMetadata, { dateFormat, ...props }) => {
		return <DateFieldInner fieldMetadata={fieldMetadata} {...props} dateFormat={dateFormat || 'Pp'} showTimeSelect />
	},
	'DateTimeField',
)
