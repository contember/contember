import { FormGroup, HTMLSelect, IRadioGroupProps, Radio, RadioGroup } from '@blueprintjs/core'
import * as React from 'react'
import { FieldName } from '../../bindingTypes'
import { Environment } from '../../dao'
import { Component } from '../Component'
import { ChoiceField, ChoiceFieldProps } from './ChoiceField'

export interface SelectFieldPublicProps {
	name: FieldName
	label?: IRadioGroupProps['label']
	inline?: boolean
}

export interface SelectFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type SelectFieldProps = SelectFieldPublicProps & SelectFieldInternalProps

class SelectField extends Component<SelectFieldProps>(props => {
	return (
		<ChoiceField name={props.name} options={props.options}>
			{(data, currentValue, onChange, environment) => {
				return (
					<SelectField.SelectFieldInner
						name={props.name}
						label={props.label}
						inline={props.inline}
						data={data}
						currentValue={currentValue}
						onChange={onChange}
						environment={environment}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'SelectField') {}

namespace SelectField {
	export interface SelectFieldInnerProps<Label extends React.ReactNode = React.ReactNode> {
		name: FieldName
		label?: IRadioGroupProps['label']
		inline?: boolean

		data: ChoiceField.Data<Label, ChoiceField.DynamicValue | ChoiceField.StaticValue>
		currentValue: ChoiceField.ValueRepresentation | null
		onChange: (newValue: ChoiceField.ValueRepresentation) => void
		environment: Environment
	}

	export class SelectFieldInner<Label extends React.ReactNode = React.ReactNode> extends React.PureComponent<
		SelectFieldInnerProps<Label>
	> {
		public render() {
			console.log(this.props.data)
			return (
				<FormGroup
					label={this.props.label}
					inline={this.props.inline}
				>
					<HTMLSelect
						value={this.props.currentValue === null ? undefined : this.props.currentValue}
						onChange={event => this.props.onChange(parseInt(event.currentTarget.value, 10))}
						options={this.props.data.map(([value, label]) => {
							return {
								value, label: label as string
							}
						})}
					/>
				</FormGroup>
			)
		}
	}
}

export { SelectField }
