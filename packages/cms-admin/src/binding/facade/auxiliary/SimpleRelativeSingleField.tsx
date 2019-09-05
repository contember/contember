import { FormGroup, FormGroupProps } from '@contember/ui'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { Scalar } from '../../bindingTypes'
import {
	AccessorContext,
	Field,
	FieldMetadata,
	FieldPublicProps,
	SyntheticChildrenProvider,
} from '../../coreComponents'
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
		props => <RelativeSingleField<P, Persisted, Produced> {...props} render={render} />,
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

type RelativeSingleFieldProps<
	P extends FieldPublicProps & Omit<FormGroupProps, 'children'>,
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> = P & {
	render: undefined | ((fieldMetadata: FieldMetadata<Persisted, Produced>, props: P) => React.ReactNode)
}

const RelativeSingleField = <
	P extends FieldPublicProps & Omit<FormGroupProps, 'children'>,
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>({
	render,
	...props
}: RelativeSingleFieldProps<P, Persisted, Produced>) => {
	const dataContext = React.useContext(AccessorContext)

	if (!render) {
		return null
	}

	return (
		<Field<Persisted, Produced> name={props.name} defaultValue={props.defaultValue}>
			{fieldMetadata => (
				<FormGroup
					label={
						props.label && (
							<AccessorContext.Provider value={dataContext}>
								{fieldMetadata.environment.applySystemMiddleware('labelMiddleware', props.label)}
							</AccessorContext.Provider>
						)
					}
					size={props.size}
					labelDescription={
						props.labelDescription && (
							<AccessorContext.Provider value={dataContext}>{props.labelDescription}</AccessorContext.Provider>
						)
					}
					labelPosition={props.labelPosition}
					description={
						props.description && (
							<AccessorContext.Provider value={dataContext}>{props.description}</AccessorContext.Provider>
						)
					}
					errors={fieldMetadata.errors}
				>
					{render(fieldMetadata, (props as any) as P)}
				</FormGroup>
			)}
		</Field>
	)
}
