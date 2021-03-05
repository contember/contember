import { FieldAccessor } from '@contember/binding'
import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { FocusEvent as ReactFocusEvent, forwardRef, memo, Ref, useMemo } from 'react'
import DatePicker, { ReactDatePickerProps } from 'react-datepicker'
import {
	SimpleRelativeSingleField,
	SimpleRelativeSingleFieldMetadata,
	SimpleRelativeSingleFieldProps,
} from '../auxiliary'

export type DateFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState'> & {
		dateFormat?: ReactDatePickerProps['dateFormat']
		showTimeSelect?: ReactDatePickerProps['showTimeSelect']
	}

export const DateField = SimpleRelativeSingleField<DateFieldProps, string>(
	(fieldMetadata, props) => <DateFieldInner fieldMetadata={fieldMetadata} {...props} />,
	'DateField',
)

export interface DateFieldInnerProps extends Omit<DateFieldProps, 'field' | 'label' | 'isNonbearing' | 'defaultValue'> {
	fieldMetadata: SimpleRelativeSingleFieldMetadata<string>
}

export const DateFieldInner = memo(
	forwardRef((props: DateFieldInnerProps, suppliedRef: Ref<any>) => {
		const generateOnChange = (data: FieldAccessor<string>) => (date: Date | null) => {
			data.updateValue(date ? date.toISOString() : null)
		}
		const { onFocus: outerOnFocus, onBlur: outerOnBlur } = props
		const UnderlyingTextInput = useMemo(
			() =>
				forwardRef<any, any>((innerProps, ref) => {
					const { className, onFocus, onBlur, ...legalProps } = innerProps
					return (
						<TextInput
							{...legalProps}
							ref={suppliedRef}
							onFocus={(e: ReactFocusEvent<HTMLInputElement>) => {
								outerOnFocus && outerOnFocus(e)
								innerProps.onFocus && innerProps.onFocus(e)
							}}
							onBlur={(e: ReactFocusEvent<HTMLInputElement>) => {
								outerOnBlur && outerOnBlur(e)
								innerProps.onBlur && innerProps.onBlur(e)
							}}
						/>
					)
				}),
			[outerOnBlur, outerOnFocus, suppliedRef],
		)
		return (
			<DatePicker
				selected={props.fieldMetadata.field.value !== null ? new Date(props.fieldMetadata.field.value) : null}
				onChange={generateOnChange(props.fieldMetadata.field)}
				readOnly={props.fieldMetadata.isMutating}
				isClearable={true}
				customInput={<UnderlyingTextInput />}
				dateFormat={props.dateFormat}
				showTimeSelect={props.showTimeSelect}
			/>
		)
	}),
)
