import * as React from 'react'
import { FormGroup, FormGroupProps, Select } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Environment, ErrorAccessor } from '../../dao'
import { Component } from '../auxiliary'
import { ChoiceArity, ChoiceField, ChoiceFieldProps, SingleChoiceFieldMetadata } from './ChoiceField'

export interface SelectFieldPublicProps {
	name: FieldName
	label?: FormGroupProps['label']
	firstOptionCaption?: React.ReactNode
	options: ChoiceFieldProps['options']
	allowNull?: boolean
	children?: ChoiceFieldProps['optionFieldFactory']
}

export type SelectFieldProps = SelectFieldPublicProps

export const SelectField = Component<SelectFieldProps>(props => {
	return (
		<ChoiceField
			name={props.name}
			options={props.options}
			arity={ChoiceArity.Single}
			optionFieldFactory={props.children}
		>
			{({ data, currentValue, onChange, environment, isMutating, errors }: SingleChoiceFieldMetadata) => {
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
						errors={errors}
						isMutating={isMutating}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'SelectField')

export interface SelectFieldInnerProps
	extends Omit<SelectFieldPublicProps, 'options'>,
		Omit<SingleChoiceFieldMetadata, 'fieldName'> {
	environment: Environment
	errors: ErrorAccessor[]
	isMutating: boolean
}

export class SelectFieldInner extends React.PureComponent<SelectFieldInnerProps> {
	public render() {
		const options = Array<Select.Option>({
			disabled: this.props.allowNull !== true,
			value: -1,
			label: this.props.firstOptionCaption || this.props.label || ''
		}).concat(
			this.props.data.map(({ key, label }) => {
				return {
					disabled: false,
					value: key,
					label: label
				}
			})
		)

		return (
			<FormGroup label={this.props.label} errors={this.props.errors}>
				<Select
					value={this.props.currentValue.toString()}
					onChange={event => {
						this.props.onChange(parseInt(event.currentTarget.value, 10))
					}}
					options={options}
					disabled={this.props.isMutating}
				/>
			</FormGroup>
		)
	}
}
