import { arrayDifference } from 'cms-common'
import * as React from 'react'
import { FormGroup, FormGroupProps, Select } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Environment, ErrorAccessor } from '../../dao'
import { Component } from '../aux'
import { ChoiceArity, ChoiceField, ChoiceFieldMetadata, ChoiceFieldProps } from './ChoiceField'

export interface SelectFieldPublicProps {
	name: FieldName
	label?: FormGroupProps['label']
	firstOptionCaption?: string
	allowNull?: boolean
	multiple?: boolean
}

export interface SelectFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type SelectFieldProps = SelectFieldPublicProps & SelectFieldInternalProps

export const SelectField = Component<SelectFieldProps>(props => {
	return (
		<ChoiceField
			name={props.name}
			options={props.options}
			arity={props.multiple ? ChoiceArity.Multiple : ChoiceArity.Single}
		>
			{({ data, currentValues, onChange, environment, isMutating, errors }) => {
				return (
					<SelectFieldInner
						name={props.name}
						label={props.label}
						allowNull={props.allowNull}
						firstOptionCaption={props.firstOptionCaption}
						data={data}
						currentValues={currentValues}
						onChange={onChange}
						environment={environment}
						errors={errors}
						isMutating={isMutating}
						multiple={props.multiple}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'SelectField')

export interface SelectFieldInnerProps extends SelectFieldPublicProps, Omit<ChoiceFieldMetadata, 'fieldName'> {
	environment: Environment
	errors: ErrorAccessor[]
	isMutating: boolean
	multiple?: boolean
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
			this.props.data.map(({ key, label }) => {
				return {
					disabled: false,
					value: key,
					label: label as string
				}
			})
		)

		const normalizedValues = this.props.currentValues ? this.props.currentValues.map(value => value.toString()) : ['-1']

		return (
			<FormGroup label={this.props.label} errors={this.props.errors}>
				<Select
					value={this.props.multiple ? normalizedValues : normalizedValues[0]}
					onChange={event => {
						if (this.props.multiple) {
							const selectedOptions: ChoiceField.ValueRepresentation[] = []

							// Not using .selectedOptions due to IE…
							for (let i = 0; i < event.currentTarget.options.length; i++) {
								const option = event.currentTarget.options[i]
								if (option.selected) {
									selectedOptions.push(parseInt(option.value, 10))
								}
							}
							const newlySelected = arrayDifference(selectedOptions, this.props.currentValues || [])
							if (newlySelected.length) {
								for (const selectedValue of newlySelected) {
									this.props.onChange(selectedValue, true)
								}
							} else {
								const newlyRemoved = arrayDifference(this.props.currentValues || [], selectedOptions)
								for (const removedValue of newlyRemoved) {
									this.props.onChange(removedValue, false)
								}
							}
						} else {
							this.props.onChange(0, parseInt(event.currentTarget.value, 10))
						}
					}}
					options={options}
					disabled={this.props.isMutating}
					multiple={this.props.multiple}
				/>
			</FormGroup>
		)
	}
}
