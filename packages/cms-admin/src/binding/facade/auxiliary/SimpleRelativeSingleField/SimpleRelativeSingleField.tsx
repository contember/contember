import { FormGroupProps } from '@contember/ui'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { Scalar } from '../../../accessorTree'
import { Component, Field, FieldMetadata, FieldPublicProps, SyntheticChildrenProvider } from '../../../coreComponents'
import { Environment } from '../../../dao'
import { QueryLanguage } from '../../../queryLanguage'
import { SimpleRelativeSingleFieldProxy } from './SimpleRelativeSingleFieldProxy'

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
		props => <SimpleRelativeSingleFieldProxy {...props} render={render} />,
		(props: P, environment: Environment) => (
			<>
				{QueryLanguage.wrapRelativeSingleField(props.name, environment, fieldName => (
					<Field defaultValue={props.defaultValue} name={fieldName} />
				))}
				{props.label}
				{props.labelDescription}
				{props.description}
			</>
		),
		displayName,
	)
}
