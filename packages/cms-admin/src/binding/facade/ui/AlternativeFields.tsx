import cn from 'classnames'
import * as React from 'react'
import { EnforceSubtypeRelation, Props, SyntheticChildrenProvider } from '../../coreComponents'
import { RadioField, RadioFieldPublicProps } from '../fields'
import { ChoiceField } from '../fields/ChoiceField'

export interface AlternativeFieldsProps extends RadioFieldPublicProps {
	alternatives: AlternativeFields.ControllerFieldMetadata
}

class AlternativeFields extends React.PureComponent<AlternativeFieldsProps> {
	public static displayName = 'AlternativeFields'

	public render() {
		return (
			<div className="alternativeFields">
				<ChoiceField name={this.props.name} options={Object.values(this.props.alternatives)}>
					{(data, currentValue, onChange, environment) => {
						const alternatives: React.ReactNodeArray = []
						for (let i = 0, length = this.props.alternatives.length; i < length; i++) {
							alternatives.push(
								<div className={cn('alternativeFields-item', i === currentValue && 'is-active')} key={i}>
									{this.props.alternatives[i][2]}
								</div>
							)
						}
						return (
							<>
								<RadioField.RadioFieldInner
									name={this.props.name}
									label={this.props.label}
									inline={this.props.inline !== false}
									data={data}
									currentValue={currentValue}
									onChange={onChange}
									environment={environment}
								/>
								<div className="alternativeFields-items">{alternatives}</div>
							</>
						)
					}}
				</ChoiceField>
			</div>
		)
	}

	public static generateSyntheticChildren(props: Props<AlternativeFieldsProps>): React.ReactNode {
		const alternatives: React.ReactNodeArray = []
		for (let i = 0, length = props.alternatives.length; i < length; i++) {
			alternatives.push(props.alternatives[2])
		}
		return (
			<>
				<RadioField name={props.name} options={Object.values(props.alternatives)} />
				{alternatives}
			</>
		)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof AlternativeFields,
	SyntheticChildrenProvider<AlternativeFieldsProps>
>

namespace AlternativeFields {
	// This isn't React.ReactNode so as to exclude arrays and other likely irrelevant values
	export type ControllerFieldLabel = React.ReactNode

	export type ControllerFieldLiteralMetadata = [ChoiceField.LiteralValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldScalarMetadata = [ChoiceField.ScalarValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldMetadata = Array<ControllerFieldLiteralMetadata> | Array<ControllerFieldScalarMetadata>
}

export { AlternativeFields }
