import type { FieldAccessor } from '@contember/binding'
import { DateTimeInput, dateToDatetimeLocalValue, SingleLineTextInputProps } from '@contember/ui'
import { ChangeEvent, forwardRef, memo, Ref } from 'react'
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

const deserialize = (date: string | null): string => date
	? dateToDatetimeLocalValue(new Date(date))
	: ''

const serialize = (date: string | null) => date
	? new Date(date).toISOString()
	: null

const generateOnChange = (data: FieldAccessor<string>) => (event: ChangeEvent<HTMLInputElement>) => {
	console.log({ generateOnChange: event.target.value })

	data.updateValue(serialize(event.target.value ? event.target.value : null))
}

export const DateFieldInner = memo(
	forwardRef((props: DateFieldInnerProps, suppliedRef: Ref<any>) => {
		return <DateTimeInput
			{...props}
			onChange={generateOnChange(props.fieldMetadata.field)}
			ref={suppliedRef}
			value={deserialize(props.fieldMetadata.field.value)}
			type={props.showTimeSelect ? 'datetime' : 'date'}
		/>
	}),
)
