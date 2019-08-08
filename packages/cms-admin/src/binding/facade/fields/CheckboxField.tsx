import * as React from 'react'
import { Checkbox, FormGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../auxiliary'

export interface CheckboxFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	defaultValue?: boolean
}

const renderCheckboxField: React.FunctionComponent<CheckboxFieldProps> = (props: CheckboxFieldProps) => {
	const generateOnChange = (data: FieldAccessor<boolean>) => (isChecked: boolean) => {
		data.updateValue && data.updateValue(isChecked)
	}
	return (
		<Field<boolean> name={props.name}>
			{({ data, isMutating, environment, errors }): React.ReactNode => (
				<Checkbox checked={!!data.currentValue} onChange={generateOnChange(data)} readOnly={isMutating} errors={errors}>
					{environment.applySystemMiddleware('labelMiddleware', props.label)}
				</Checkbox>
			)}
		</Field>
	)
}

renderCheckboxField.defaultProps = {
	defaultValue: false,
}

export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps>(renderCheckboxField, 'CheckboxField')
