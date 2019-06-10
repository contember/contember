import * as React from 'react'
import { FormGroup, FormGroupProps, Select } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Environment } from '../../dao'
import { Component } from '../aux'
import { ChoiceField, ChoiceFieldProps } from './ChoiceField'

export interface SelectFieldPublicProps {
	name: FieldName
	label?: FormGroupProps['label']
	firstOptionCaption?: string
	allowNull?: boolean
}

export interface SelectFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type SelectFieldProps = SelectFieldPublicProps & SelectFieldInternalProps

export const SelectField = Component<SelectFieldProps>(props => {
	return (
		<ChoiceField name={props.name} options={props.options}>
			{({ data, currentValue, onChange, environment, isMutating }) => {
				return (
					<SelectFieldInner
						name={props.name}
						label={props.label}
						allowNull={props.allowNull}
						firstOptionCaption={props.firstOptionCaption}
						data={data}
						currentValue={currentValue}
						onChange={onChange}
						environment={environment}
						isMutating={isMutating}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'SelectField')

export interface SelectFieldInnerProps extends SelectFieldPublicProps {
	data: ChoiceField.Data<ChoiceField.DynamicValue | ChoiceField.StaticValue>
	currentValue: ChoiceField.ValueRepresentation | null
	onChange: (newValue: ChoiceField.ValueRepresentation) => void
	environment: Environment
	isMutating: boolean
}

export class SelectFieldInner extends React.PureComponent<SelectFieldInnerProps> {
	public render() {
		const options: Select.Option[] = [
			{
				disabled: this.props.allowNull !== true,
				value: -1,
				label: this.props.firstOptionCaption || (typeof this.props.label === 'string' ? this.props.label : '')
			}
		].concat(
			this.props.data.map(([value, label]) => {
				return {
					disabled: false,
					value,
					label: label as string
				}
			})
		)

		return (
			<FormGroup label={this.props.label}>
				<Select
					value={this.props.currentValue === null ? -1 : this.props.currentValue}
					onChange={event => this.props.onChange(parseInt(event.currentTarget.value, 10))}
					options={options}
					disabled={this.props.isMutating}
				/>
			</FormGroup>
		)
	}
}
