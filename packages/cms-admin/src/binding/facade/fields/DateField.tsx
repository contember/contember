import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import * as React from 'react'
import DatePicker from 'react-datepicker'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type DateFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState'> & {
		ref?: React.Ref<HTMLInputElement>
	}

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
			customInput={<UnderlyingTextInput />}
			customInputRef={props.ref as any}
		/>
	)
}, 'DateField')

const UnderlyingTextInput = React.forwardRef<any, any>((props, ref) => {
	const { className, ...legalProps } = props
	return <TextInput {...legalProps} ref={ref} />
})
