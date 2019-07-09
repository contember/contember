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
	horizontal?: boolean
}

export const TextField = SimpleRelativeSingleField<TextFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}
	return (
		<Field<string> name={props.name}>
			{({ data, isMutating, environment, errors }): React.ReactNode => (
				<FormGroup
					label={props.label ? environment.applySystemMiddleware('labelMiddleware', props.label) : undefined}
					horizontal={props.horizontal}
				>
					{errors.map(e => e.message).join(', ')}
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
