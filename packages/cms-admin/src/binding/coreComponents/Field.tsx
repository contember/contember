import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { DataTreeMutationState } from '../../state/dataTrees'
import { FieldName, Scalar, VariableInput } from '../bindingTypes'
import {
	DataBindingError,
	EntityAccessor,
	EntityForRemovalAccessor,
	Environment,
	FieldAccessor,
	FieldMarker
} from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { FieldMarkerProvider } from './MarkerProvider'
import { MutationStateContext } from './PersistState'

export interface FieldPublicProps {
	name: FieldName
	defaultValue?: VariableInput | Scalar
}

export interface FieldMetadata<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> {
	fieldName: FieldName
	data: FieldAccessor<Persisted, Produced>
	isMutating: DataTreeMutationState
	environment: Environment
}

export interface FieldProps<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> extends FieldPublicProps {
	children?: (metadata: FieldMetadata<Persisted, Produced>) => React.ReactNode
	isNonbearing?: boolean
}

class Field<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> extends React.PureComponent<FieldProps<Persisted, Produced>> {
	public static displayName = 'Field'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{({ fieldName, data, isMutating, environment }) => {
					if (data instanceof EntityAccessor) {
						const fieldData = data.data.getField(fieldName)

						if (this.props.children && fieldData instanceof FieldAccessor) {
							return (
								<Field.FieldInner<Persisted, Produced>
									fieldName={fieldName}
									data={(fieldData as unknown) as FieldAccessor<Persisted, Produced>}
									isMutating={isMutating}
									environment={environment}
								>
									{this.props.children}
								</Field.FieldInner>
							)
						} else {
							throw new DataBindingError(`Undefined field '${fieldName}'`)
						}
					} else if (data instanceof EntityForRemovalAccessor) {
						// Do nothing
					} else {
						throw new DataBindingError('Corrupted data')
					}
				}}
			</Field.DataRetriever>
		)
	}

	public static generateFieldMarker(props: FieldProps, environment: Environment): FieldMarker {
		return new FieldMarker(
			props.name,
			props.defaultValue !== undefined
				? VariableInputTransformer.transformValue(props.defaultValue, environment)
				: undefined,
			props.isNonbearing === true
		)
	}
}

namespace Field {
	export interface RawMetadata extends Pick<FieldMetadata, Exclude<keyof FieldMetadata, 'data'>> {
		data: DataContextValue
	}

	export interface FieldInnerProps<
		Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
		Produced extends Persisted = Persisted
	> extends FieldMetadata<Persisted, Produced> {
		children: Exclude<FieldProps<Persisted, Produced>['children'], undefined>
	}

	export class FieldInner<
		Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
		Produced extends Persisted = Persisted
	> extends React.PureComponent<FieldInnerProps<Persisted, Produced>> {
		public render() {
			return this.props.children({
				fieldName: this.props.fieldName,
				data: this.props.data,
				isMutating: this.props.isMutating,
				environment: this.props.environment
			})
		}
	}

	export interface DataRetrieverProps {
		name: FieldName
		children: (rawMetadata: RawMetadata) => React.ReactNode
	}

	export class DataRetriever extends React.Component<DataRetrieverProps> {
		public render() {
			return (
				<EnvironmentContext.Consumer>
					{environment =>
						QueryLanguage.wrapRelativeSingleField(
							this.props.name,
							fieldName => (
								<MutationStateContext.Consumer>
									{isMutating => (
										<DataContext.Consumer>
											{(data: DataContextValue) =>
												this.props.children({
													fieldName,
													data,
													isMutating,
													environment
												})
											}
										</DataContext.Consumer>
									)}
								</MutationStateContext.Consumer>
							),
							environment
						)
					}
				</EnvironmentContext.Consumer>
			)
		}
	}
}

export { Field }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider<FieldProps>>
