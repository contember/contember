import * as React from 'react'
import { Environment } from '../../dao'
import { RadioFieldPublicProps, SelectFieldInner } from '../fields'
import { ChoiceArity, ChoiceField, SingleChoiceFieldMetadata, StaticChoiceFieldProps } from '../fields/ChoiceField'

export interface AlternativeFieldsProps extends RadioFieldPublicProps {
	alternatives: AlternativeFields.ControllerFieldMetadata
	allowBlockTypeChange?: boolean
}

class AlternativeFields extends React.PureComponent<AlternativeFieldsProps> {
	public static displayName = 'AlternativeFields'

	public render(): React.ReactNode {
		return (
			<div className="alternativeFields">
				<ChoiceField
					name={this.props.name}
					options={(this.props.alternatives as unknown) as StaticChoiceFieldProps['options']}
					arity={ChoiceArity.Single}
				>
					{({ data, currentValue, onChange, isMutating, environment, errors }: SingleChoiceFieldMetadata) => (
						<>
							{this.props.allowBlockTypeChange !== false && (
								<SelectFieldInner
									label={this.props.label}
									data={data}
									currentValue={currentValue}
									onChange={onChange}
									environment={environment}
									errors={errors}
									firstOptionCaption="Choose…"
									isMutating={isMutating}
								/>
							)}
							{currentValue in this.props.alternatives && (
								<div className="alternativeFields-items">
									<div className="alternativeFields-item" key={currentValue}>
										{this.props.alternatives[currentValue][2]}
									</div>
								</div>
							)}
						</>
					)}
				</ChoiceField>
			</div>
		)
	}

	public static generateSyntheticChildren(props: AlternativeFieldsProps, environment: Environment): React.ReactNode {
		const alternatives: React.ReactNodeArray = []

		for (let i = 0, length = props.alternatives.length; i < length; i++) {
			alternatives.push(<React.Fragment key={i}>{props.alternatives[i][2]}</React.Fragment>)
		}

		return (
			<>
				{ChoiceField.generateSyntheticChildren(
					{
						name: props.name,
						options: Object.values(props.alternatives),
						arity: ChoiceArity.Single,
					},
					environment,
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
