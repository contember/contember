import { IRadioGroupProps, Radio, RadioGroup } from '@blueprintjs/core'
import * as React from 'react'
import { EntityName, FieldName, Filter } from '../../bindingTypes'
import { EnforceSubtypeRelation, Props, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { ChoiceField, ChoiceFieldProps, ChoiceFieldStaticProps } from './ChoiceField'

export interface RadioFieldPublicProps {
	name: FieldName
	label: IRadioGroupProps['label']
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

export class RadioField extends React.Component<RadioFieldProps> {
	public static displayName = 'RadioField'

	public render() {
		const restProps =
			'options' in this.props
				? {
						options: this.props.options
				  }
				: {
						entityName: this.props.entityName,
						optionFieldName: this.props.optionFieldName,
						filter: this.props.filter
				  }

		return (
			<ChoiceField name={this.props.name} {...restProps}>
				{(data, currentValue, onChange, environment) => {
					return (
						<RadioGroup
							label={this.props.label}
							selectedValue={currentValue === null ? undefined : currentValue}
							onChange={event => onChange(event.currentTarget.value)}
							inline={this.props.inline}
						>
							{data.map(choice => {
								const [value, label] = choice
								return <Radio value={value} labelElement={label} key={value} />
							})}
						</RadioGroup>
					)
				}}
			</ChoiceField>
		)
	}

	public static generateSyntheticChildren(props: Props<RadioFieldProps>, environment: Environment): React.ReactNode {
		return ChoiceField.generateSyntheticChildren(props, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof RadioField,
	SyntheticChildrenProvider<RadioFieldProps>
>
