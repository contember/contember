import { arrayDifference } from 'cms-common'
import * as React from 'react'
import { FormGroup, FormGroupProps, Select } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Environment, ErrorAccessor } from '../../dao'
import { Component } from '../auxiliary'
import { ChoiceArity, ChoiceField, ChoiceFieldProps, MultipleChoiceFieldMetadata } from './ChoiceField'

export interface MultipleSelectFieldPublicProps {
	name: FieldName
	label?: FormGroupProps['label']
	firstOptionCaption?: string
}

export interface MultipleSelectFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type MultipleSelectFieldProps = MultipleSelectFieldPublicProps & MultipleSelectFieldInternalProps

export const MultipleSelectField = Component<MultipleSelectFieldProps>(props => {
	return (
		<ChoiceField name={props.name} options={props.options} arity={ChoiceArity.Multiple}>
			{({ data, currentValues, onChange, environment, isMutating, errors }: MultipleChoiceFieldMetadata) => {
				return (
					<MultipleSelectFieldInner
						name={props.name}
						label={props.label}
						firstOptionCaption={props.firstOptionCaption}
						data={data}
						currentValues={currentValues}
						onChange={onChange}
						environment={environment}
						errors={errors}
						isMutating={isMutating}
					/>
				)
			}}
		</ChoiceField>
	)
}, 'MultipleSelectField')

export interface MultipleSelectFieldInnerProps
	extends MultipleSelectFieldPublicProps,
		Omit<MultipleChoiceFieldMetadata, 'fieldName'> {
	environment: Environment
	errors: ErrorAccessor[]
	isMutating: boolean
}

export class MultipleSelectFieldInner extends React.PureComponent<MultipleSelectFieldInnerProps> {
	public render() {
		const options: Select.Option[] = this.props.data.map(({ key, label }) => {
			return {
				disabled: false,
				value: key,
				label: label as string,
			}
		})

		const normalizedValues = this.props.currentValues ? this.props.currentValues.map(value => value.toString()) : ['-1']

		return (
			<FormGroup label={this.props.label} errors={this.props.errors}>
				<Select
					value={normalizedValues}
					onChange={event => {
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
					}}
					options={options}
					disabled={this.props.isMutating}
					multiple={true}
				/>
			</FormGroup>
		)
	}
}
