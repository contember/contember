import * as React from 'react'
import { ChangeEvent } from 'react'
import { FormGroup, FormGroupProps, TextArea } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Field } from '../../coreComponents'
import { FieldAccessor } from '../../dao'
import { SimpleRelativeSingleField } from '../aux'

export interface TextAreaFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
	large?: boolean
}

export const TextAreaField = SimpleRelativeSingleField<TextAreaFieldProps>(props => {
	const generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLTextAreaElement>) => {
		data.onChange && data.onChange(e.target.value)
	}
	return (
		<Field<string> name={props.name}>
			{({ data, environment }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)}>
					<TextArea
						value={data.currentValue || ''}
						onChange={generateOnChange(data)}
						large={props.large}
						// fill={true}
					/>
				</FormGroup>
			)}
		</Field>
	)
}, 'TextAreaField')
