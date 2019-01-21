import cn from 'classnames'
import * as React from 'react'
import { Component } from '../Component'
import { RadioField, RadioFieldPublicProps } from '../fields'
import { ChoiceField } from '../fields/ChoiceField'

export interface AlternativeFieldsProps extends RadioFieldPublicProps {
	alternatives: AlternativeFields.ControllerFieldMetadata
}

class AlternativeFields extends Component<AlternativeFieldsProps>(
	props => (
		<div className="alternativeFields">
			<ChoiceField name={props.name} options={Object.values(props.alternatives)}>
				{(data, currentValue, onChange, environment) => {
					const alternatives: React.ReactNodeArray = []
					for (let i = 0, length = props.alternatives.length; i < length; i++) {
						alternatives.push(
							<div className={cn('alternativeFields-item', i === currentValue && 'is-active')} key={i}>
								{props.alternatives[i][2]}
							</div>
						)
					}
					return (
						<>
							<RadioField.RadioFieldInner
								name={props.name}
								label={props.label}
								inline={props.inline !== false}
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
	),
	'AlternativeFields'
) {}

namespace AlternativeFields {
	// This isn't React.ReactNode so as to exclude arrays and other likely irrelevant values
	export type ControllerFieldLabel = React.ReactNode

	export type ControllerFieldLiteralMetadata = [ChoiceField.LiteralValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldScalarMetadata = [ChoiceField.ScalarValue, ControllerFieldLabel, React.ReactNode]

	export type ControllerFieldMetadata = Array<ControllerFieldLiteralMetadata> | Array<ControllerFieldScalarMetadata>
}

export { AlternativeFields }
