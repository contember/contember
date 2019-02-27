import { IRadioGroupProps, Radio, RadioGroup } from '@blueprintjs/core'
import * as React from 'react'
import { FormGroup } from '../../../components'
import { FieldName } from '../../bindingTypes'
import { Environment } from '../../dao'
import { Component } from '../aux'
import { ChoiceField, ChoiceFieldProps } from './ChoiceField'

export interface RadioFieldPublicProps {
	name: FieldName
	label?: IRadioGroupProps['label']
	inline?: boolean
}

export interface RadioFieldInternalProps {
	options: ChoiceFieldProps['options']
}

export type RadioFieldProps = RadioFieldPublicProps & RadioFieldInternalProps

class RadioField extends Component<RadioFieldProps>(props => {
	return (
		<ChoiceField name={props.name} options={props.options}>
			{(data, currentValue, onChange, isMutating, environment) => {
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
	export interface RadioFieldInnerProps extends RadioFieldPublicProps {
		data: ChoiceField.Data<ChoiceField.DynamicValue | ChoiceField.StaticValue>
		currentValue: ChoiceField.ValueRepresentation | null
		onChange: (newValue: ChoiceField.ValueRepresentation) => void
		environment: Environment
	}

	export class RadioFieldInner extends React.PureComponent<RadioFieldInnerProps> {
		public render() {
			return (
				<FormGroup label={this.props.label}>
					<RadioGroup
						selectedValue={this.props.currentValue === null ? undefined : this.props.currentValue}
						onChange={event => this.props.onChange(parseInt(event.currentTarget.value, 10))}
					>
						{this.props.data.map(choice => {
							const [value, label] = choice
							return <Radio value={value} labelElement={label} key={value} />
						})}
					</RadioGroup>
				</FormGroup>
			)
		}
	}
}

export { RadioField }
