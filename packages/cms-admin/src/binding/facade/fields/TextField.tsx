import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps, InputGroup, InputGroupProps } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../aux'

export interface TextFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	large?: InputGroupProps['large']
	inlineLabel?: boolean
}

export const TextField = SimpleRelativeSingleField<TextFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}
	return (
		<Field<string> name={props.name}>
			{({ data, isMutating, environment }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)}>
					<InputGroup
						value={data.currentValue || ''}
						onChange={generateOnChange(data)}
						large={props.large}
						readOnly={isMutating}
					/>
				</FormGroup>
			)}
		</Field>
	)
}, 'TextField')
