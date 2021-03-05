import { FieldAccessor } from '@contember/binding'
import { SingleLineTextInputProps, TextInput } from '@contember/ui'
import { ChangeEvent } from 'react'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'

export type NumberFieldProps = SimpleRelativeSingleFieldProps &
	Omit<SingleLineTextInputProps, 'value' | 'onChange' | 'validationState' | 'allowNewlines'>

export const NumberField = SimpleRelativeSingleField<NumberFieldProps, number>(
	(fieldMetadata, { defaultValue, ...props }) => {
		const generateOnChange = (data: FieldAccessor<number>) => (e: ChangeEvent<HTMLInputElement>) => {
			data.updateValue(parseInt(e.target.value, 10))
		}
		return (
			<TextInput
				value={typeof fieldMetadata.field.value === 'number' ? fieldMetadata.field.value.toString(10) : '0'}
				onChange={generateOnChange(fieldMetadata.field)}
				validationState={fieldMetadata.field.errors ? 'invalid' : undefined}
				type="number"
				{...props}
			/>
		)
	},
	'NumberField',
)
