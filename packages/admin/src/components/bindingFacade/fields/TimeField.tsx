import type { FieldAccessor } from '@contember/binding'
import { DateTimeInput, SingleLineTextInputProps } from '@contember/ui'
import { forwardRef, memo, Ref } from 'react'
import { dateToTimeValue } from '../../../../../ui/src/components/Forms/DateTimeInput/Serializer'
import {
	SimpleRelativeSingleField,
	SimpleRelativeSingleFieldMetadata,
	SimpleRelativeSingleFieldProps,
} from '../auxiliary'

export type TimeFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'max' | 'min'> & {
		max?: string
		min?: string
	}

export const TimeField = SimpleRelativeSingleField<TimeFieldProps, string>(
	(fieldMetadata, props) => <TimeFieldInner fieldMetadata={fieldMetadata} {...props} />,
	'TimeField',
)

export interface TimeFieldInnerProps
	extends Omit<TimeFieldProps, 'field' | 'label' | 'isNonbearing' | 'defaultValue' | 'max' | 'min'> {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<string>
	max?: string
	min?: string
}

// Dummy date 1-1-1970 is used to benefit from Date class time validation
const deserializeTime = (time: string | null): string => (time ? dateToTimeValue(new Date(`1-1-1970 ${time}`)) : '')

const serialize = (time: string | null) => time

const generateOnChange = (data: FieldAccessor<string>) => (value: string | null) => {
	data.updateValue(serialize(value ? value : null))
}

export const TimeFieldInner = memo(
	forwardRef(({ fieldMetadata, ...props }: TimeFieldInnerProps, suppliedRef: Ref<any>) => {
		return (
			<DateTimeInput
				{...props}
				onChange={generateOnChange(fieldMetadata.field)}
				ref={suppliedRef}
				value={deserializeTime(fieldMetadata.field.value)}
				type="time"
			/>
		)
	}),
)
