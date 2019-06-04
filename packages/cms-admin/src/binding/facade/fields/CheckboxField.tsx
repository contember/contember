import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../aux'

export interface CheckboxFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	defaultValue?: boolean
}

const renderCheckboxField: React.FunctionComponent<CheckboxFieldProps> = (props: CheckboxFieldProps) => {
	const generateOnChange = (data: FieldAccessor<boolean>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.checked)
	}
	return (
		<Field<boolean> name={props.name}>
			{({ data, environment }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)}>
					<input type="checkbox" checked={!!data.currentValue} onChange={generateOnChange(data)} />
				</FormGroup>
			)}
		</Field>
	)
}

renderCheckboxField.defaultProps = {
	defaultValue: false
}

export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps>(renderCheckboxField, 'CheckboxField')
