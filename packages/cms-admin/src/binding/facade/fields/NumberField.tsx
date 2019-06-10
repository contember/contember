import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps, InputGroup, InputGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../aux'

export interface NumberFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	large?: InputGroupProps['large']
}

export const NumberField = SimpleRelativeSingleField<NumberFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<number>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(parseInt(e.target.value, 10))
	}
	return (
		<Field<number> name={props.name}>
			{({ data, isMutating, environment }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)}>
					<InputGroup
						value={typeof data.currentValue === 'number' ? data.currentValue.toFixed(0) : '0'}
						onChange={generateOnChange(data)}
						large={props.large}
						readOnly={isMutating}
						type="number"
					/>
				</FormGroup>
			)}
		</Field>
	)
}, 'NumberField')
