import { FieldAccessor } from '@contember/binding'
import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { ChangeEvent as ReactChangeEvent } from 'react'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type FloatFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>(
	(fieldMetadata, { defaultValue, ...props }) => {
		const generateOnChange = (data: FieldAccessor<number>) => (e: ReactChangeEvent<HTMLInputElement>) => {
			data.updateValue(parseFloat(e.target.value))
		}
		return (
			<TextInput
				value={typeof fieldMetadata.field.value === 'number' ? fieldMetadata.field.value.toString(10) : '0'}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors ? 'invalid' : undefined}
				{...props}
			/>
		)
	},
	'FloatField',
)
