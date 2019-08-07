import * as React from 'react'
import DatePicker from 'react-datepicker'
import { FormGroup, FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../auxiliary'

export interface DateFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export const DateField = SimpleRelativeSingleField<DateFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<string>) => (date: Date | null) => {
		data.updateValue && data.updateValue(date ? date.toISOString() : null)
	}
	return (
		<Field<string> name={props.name}>
			{({ data, isMutating, environment, errors }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)} errors={errors}>
					<DatePicker
						selected={data.currentValue !== null ? new Date(data.currentValue) : null}
						onChange={generateOnChange(data)}
						readOnly={isMutating}
						isClearable={true}
					/>
				</FormGroup>
			)}
		</Field>
	)
}, 'DateField')
