import { FormGroupProps } from '@contember/ui'
import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import {
	Component,
	Environment,
	Field,
	FieldMetadata,
	FieldPublicProps,
	QueryLanguage,
	Scalar,
	SyntheticChildrenProvider,
} from '../../../../binding'
import { SimpleRelativeSingleFieldProxy } from './SimpleRelativeSingleFieldProxy'

export type SimpleRelativeSingleFieldProps = FieldPublicProps & Omit<FormGroupProps, 'children'>

export const SimpleRelativeSingleField = function<
	P extends FieldPublicProps & Omit<FormGroupProps, 'children'>,
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	render: undefined | ((fieldMetadata: FieldMetadata<Persisted, Produced>, props: P) => React.ReactNode),
	displayName: string,
	defaultProps?: Partial<P>,
): React.NamedExoticComponent<P> & SyntheticChildrenProvider<P> {
	return Component<P>(
		props => <SimpleRelativeSingleFieldProxy {...defaultProps} {...props} render={render} />,
		(props: P, environment: Environment) => {
			const normalizedProps = {
				...defaultProps,
				...props,
			}
			return (
				<>
					{QueryLanguage.wrapRelativeSingleField(normalizedProps.name, environment, fieldName => (
						<Field
							defaultValue={normalizedProps.defaultValue}
							name={fieldName}
							isNonbearing={normalizedProps.isNonbearing}
						/>
					))}
					{normalizedProps.label}
					{normalizedProps.labelDescription}
					{normalizedProps.description}
				</>
			)
		},
		displayName,
	)
}
