import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../auxiliary'
import { FormErrors } from '../../../components/ui/FormErrors'

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
			{({ data, isMutating, environment, errors }): React.ReactNode => (
				<div className="checkbox">
					<FormErrors errors={errors} />
					<label className="checkbox-in">
						<input
							type="checkbox"
							readOnly={isMutating}
							checked={!!data.currentValue}
							onChange={generateOnChange(data)}
						/>
						<span className="checkbox-label">{environment.applySystemMiddleware('labelMiddleware', props.label)}</span>
						<span className="checkbox-box" />
					</label>
				</div>
			)}
		</Field>
	)
}

renderCheckboxField.defaultProps = {
	defaultValue: false
}

export const CheckboxField = SimpleRelativeSingleField<CheckboxFieldProps>(renderCheckboxField, 'CheckboxField')
