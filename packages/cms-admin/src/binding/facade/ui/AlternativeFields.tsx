import cn from 'classnames'
import * as React from 'react'
import { Props } from '../../coreComponents'
import { Environment } from '../../dao'
import { RadioFieldPublicProps, SelectFieldInner } from '../fields'
import { ChoiceField } from '../fields/ChoiceField'

export interface AlternativeFieldsProps extends RadioFieldPublicProps {
	alternatives: AlternativeFields.ControllerFieldMetadata
}

class AlternativeFields extends React.PureComponent<AlternativeFieldsProps> {
	public static displayName = 'AlternativeFields'

	public render(): React.ReactNode {
		return (
			<div className="alternativeFields">
				<ChoiceField name={this.props.name} options={Object.values(this.props.alternatives)}>
					{({ data, currentValue, onChange, isMutating, environment }) => {
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
								<SelectFieldInner
									name={this.props.name}
									label={this.props.label}
									data={data}
									currentValue={currentValue}
									onChange={onChange}
									environment={environment}
									firstOptionCaption="Choose…"
									isMutating={isMutating}
								/>
								<div className="alternativeFields-items">{alternatives}</div>
							</>
						)
					}}
				</ChoiceField>
			</div>
		)
	}

	public static generateSyntheticChildren(
		props: Props<AlternativeFieldsProps>,
		environment: Environment
	): React.ReactNode {
		const alternatives: React.ReactNodeArray = []

		for (let i = 0, length = props.alternatives.length; i < length; i++) {
			alternatives.push(<React.Fragment key={i}>{props.alternatives[i][2]}</React.Fragment>)
		}

		return (
			<>
				{ChoiceField.generateSyntheticChildren(
					{
						name: props.name,
						options: Object.values(props.alternatives)
					},
					environment
				)}
				{alternatives}
			</>
		)
	}
}

namespace AlternativeFields {
	// This isn't React.ReactNode so as to exclude arrays and other likely irrelevant values
	export type ControllerFieldLabel = React.ReactNode

	export type ControllerFieldLiteralMetadata = [ChoiceField.LiteralValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldScalarMetadata = [ChoiceField.ScalarValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldMetadata = Array<ControllerFieldLiteralMetadata> | Array<ControllerFieldScalarMetadata>
}

export { AlternativeFields }
