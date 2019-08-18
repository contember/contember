import { FormGroup, FormGroupProps } from '@contember/ui'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { Scalar } from '../../bindingTypes'
import { Field, FieldMetadata, FieldPublicProps, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from './Component'

export type SimpleRelativeSingleFieldProps = FieldPublicProps & Omit<FormGroupProps, 'children'>

export const SimpleRelativeSingleField = function<
	P extends FieldPublicProps & Omit<FormGroupProps, 'children'>,
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	render: undefined | ((fieldMetadata: FieldMetadata<Persisted, Produced>, props: P) => React.ReactNode),
	displayName: string,
): React.NamedExoticComponent<P> & SyntheticChildrenProvider<P> {
	return Component<P>(
		props => {
			if (!render) {
				return null
			}
			return (
				<Field<Persisted, Produced> name={props.name} defaultValue={props.defaultValue}>
					{fieldMetadata => (
						<FormGroup
							label={fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
							labelDescription={props.labelDescription}
							labelPosition={props.labelPosition}
							description={props.description}
							errors={fieldMetadata.errors}
						>
							{render(fieldMetadata, props)}
						</FormGroup>
					)}
				</Field>
			)
		},
		(props: P, environment: Environment) =>
			QueryLanguage.wrapRelativeSingleField(
				props.name,
				fieldName => <Field defaultValue={props.defaultValue} name={fieldName} />,
				environment,
			),
		displayName,
	)
}
