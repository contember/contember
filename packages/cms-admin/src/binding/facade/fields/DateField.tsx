import { TextInputProps } from '@contember/ui'
import * as React from 'react'
import DatePicker from 'react-datepicker'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type DateFieldProps = SimpleRelativeSingleFieldProps &
	Omit<TextInputProps, 'value' | 'onChange' | 'validationState'>

export const DateField = SimpleRelativeSingleField<DateFieldProps, string>((fieldMetadata, props) => {
	const generateOnChange = (data: FieldAccessor<string>) => (date: Date | null) => {
		data.updateValue && data.updateValue(date ? date.toISOString() : null)
	}
	return (
		<DatePicker
			selected={fieldMetadata.data.currentValue !== null ? new Date(fieldMetadata.data.currentValue) : null}
			onChange={generateOnChange(fieldMetadata.data)}
			readOnly={fieldMetadata.isMutating}
			isClearable={true}
			//customInput={} // TODO explore this
		/>
	)
}, 'DateField')
