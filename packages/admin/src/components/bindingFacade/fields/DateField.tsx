import type { FieldAccessor } from '@contember/binding'
import { DateTimeInput, dateToDatetimeLocalValue, dateToDateValue, SingleLineTextInputProps } from '@contember/ui'
import { forwardRef, memo, Ref } from 'react'
import {
	SimpleRelativeSingleField,
	SimpleRelativeSingleFieldMetadata,
	SimpleRelativeSingleFieldProps,
} from '../auxiliary'

export type DateFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'max' | 'min'> & {
		max?: string
		min?: string
		showTimeSelect?: boolean
	}

export const DateField = SimpleRelativeSingleField<DateFieldProps, string>(
	(fieldMetadata, props) => <DateFieldInner fieldMetadata={fieldMetadata} {...props} />,
	'DateField',
)

export interface DateFieldInnerProps extends Omit<DateFieldProps, 'field' | 'label' | 'isNonbearing' | 'defaultValue' | 'max' | 'min' > {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<string>
	max?: string
	min?: string
}

const deserializeDatetimeLocal = (date: string | null): string => date
	? dateToDatetimeLocalValue(new Date(date))
	: ''

const deserializeDate = (date: string | null): string => date
	? dateToDateValue(new Date(date))
	: ''

const serialize = (date: string | null) => date
	? new Date(date).toISOString()
	: null

const generateOnChange = (data: FieldAccessor<string>) => (value: string | null) => {
	data.updateValue(serialize(value ? value : null))
}

export const DateFieldInner = memo(
	forwardRef(({ fieldMetadata, showTimeSelect, ...props }: DateFieldInnerProps, suppliedRef: Ref<any>) => {
		return <DateTimeInput
			{...props}
			onChange={generateOnChange(fieldMetadata.field)}
			ref={suppliedRef}
			value={showTimeSelect
				? deserializeDatetimeLocal(fieldMetadata.field.value)
				: deserializeDate(fieldMetadata.field.value)
			}
			type={showTimeSelect ? 'datetime' : 'date'}
		/>
	}),
)
