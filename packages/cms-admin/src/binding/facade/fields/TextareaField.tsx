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
			{({ data, isMutating, environment, errors }): React.ReactNode => (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)} errors={errors}>
					<TextArea
						value={data.currentValue || ''}
						onChange={generateOnChange(data)}
						readOnly={isMutating}
						large={props.large}
						// fill={true}
					/>
				</FormGroup>
			)}
		</Field>
	)
}, 'TextAreaField')
