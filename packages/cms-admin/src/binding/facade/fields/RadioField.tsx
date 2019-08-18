import { Radio, RadioGroup } from '@blueprintjs/core'
import { FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { RelativeSingleField } from '../../bindingTypes'
import { Environment, ErrorAccessor } from '../../dao'
import { Component } from '../auxiliary'
import { ChoiceArity, ChoiceField, ChoiceFieldProps, SingleChoiceFieldMetadata } from './ChoiceField'

export interface RadioFieldPublicProps extends Omit<FormGroupProps, 'children'> {
	inline?: boolean
	name: RelativeSingleField
}

export interface RadioFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type RadioFieldProps = RadioFieldPublicProps & RadioFieldInternalProps

export const RadioField = Component<RadioFieldProps>(props => {
	return (
		<ChoiceField name={props.name} options={props.options} arity={ChoiceArity.Single}>
			{({ data, currentValue, onChange, isMutating, environment, errors }: SingleChoiceFieldMetadata) => {
				return (
					<RadioFieldInner
						name={props.name}
						label={props.label}
						inline={props.inline}
						data={data}
						currentValue={currentValue}
						onChange={onChange}
						isMutating={isMutating}
						environment={environment}
						errors={errors}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'RadioField')

interface RadioFieldInnerProps extends RadioFieldPublicProps {
	data: SingleChoiceFieldMetadata['data']
	currentValue: ChoiceField.ValueRepresentation
	onChange: SingleChoiceFieldMetadata['onChange']
	environment: Environment
	errors: ErrorAccessor[]
	isMutating: boolean
}

class RadioFieldInner extends React.PureComponent<RadioFieldInnerProps> {
	public render() {
		return (
			<FormGroup {...this.props}>
				<RadioGroup
					disabled={this.props.isMutating}
					selectedValue={this.props.currentValue === null ? undefined : this.props.currentValue}
					onChange={event => this.props.onChange(parseInt(event.currentTarget.value, 10))}
				>
					{this.props.data.map(choice => {
						const { key, label } = choice
						return <Radio value={key} labelElement={label} key={key} />
					})}
				</RadioGroup>
			</FormGroup>
		)
	}
}
