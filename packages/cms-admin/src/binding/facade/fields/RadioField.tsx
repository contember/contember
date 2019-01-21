import { IRadioGroupProps, Radio, RadioGroup } from '@blueprintjs/core'
import * as React from 'react'
import { EntityName, FieldName, Filter } from '../../bindingTypes'
import { Environment } from '../../dao'
import { Component } from '../Component'
import { ChoiceField, ChoiceFieldStaticProps } from './ChoiceField'

export interface RadioFieldPublicProps {
	name: FieldName
	label?: IRadioGroupProps['label']
	inline?: boolean
}

export interface RadioFieldStaticProps {
	options: ChoiceFieldStaticProps['options']
}

export interface RadioFieldDynamicProps {
	entityName: EntityName
	optionFieldName: FieldName
	filter?: Filter
}

export type RadioFieldProps = RadioFieldPublicProps & (RadioFieldStaticProps | RadioFieldDynamicProps)

class RadioField extends Component<RadioFieldProps>(props => {
	const restProps =
		'options' in props
			? {
					options: props.options
			  }
			: {
					entityName: props.entityName,
					optionFieldName: props.optionFieldName,
					filter: props.filter
			  }

	return (
		<ChoiceField name={props.name} {...restProps}>
			{(data, currentValue, onChange, environment) => {
				return (
					<RadioField.RadioFieldInner
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
}, 'RadioField') {}

namespace RadioField {
	export interface RadioFieldInnerProps<Label extends React.ReactNode = React.ReactNode> {
		name: FieldName
		label?: IRadioGroupProps['label']
		inline?: boolean

		data: ChoiceField.Data<Label, ChoiceField.DynamicValue | ChoiceField.StaticValue>
		currentValue: ChoiceField.ValueRepresentation | null
		onChange: (newValue: ChoiceField.ValueRepresentation) => void
		environment: Environment
	}

	export class RadioFieldInner<Label extends React.ReactNode = React.ReactNode> extends React.PureComponent<
		RadioFieldInnerProps<Label>
	> {
		public render() {
			return (
				<RadioGroup
					label={this.props.label}
					selectedValue={this.props.currentValue === null ? undefined : this.props.currentValue}
					onChange={event => this.props.onChange(parseInt(event.currentTarget.value, 10))}
					inline={this.props.inline}
				>
					{this.props.data.map(choice => {
						const [value, label] = choice
						return <Radio value={value} labelElement={label} key={value} />
					})}
				</RadioGroup>
			)
		}
	}
}

export { RadioField }
