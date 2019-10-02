import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { DataTreeMutationState } from '../../state/dataTrees'
import { FieldName, RelativeSingleField, VariableInput } from '../bindingTypes'
import {
	DataBindingError,
	EntityAccessor,
	EntityForRemovalAccessor,
	Environment,
	ErrorAccessor,
	FieldAccessor,
	FieldMarker,
} from '../dao'
import { Scalar } from '../dataTree'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage'
import { AccessorContext, AccessorContextValue } from './AccessorContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { FieldMarkerProvider } from './MarkerProvider'
import { MutationStateContext } from './PersistState'

export interface FieldPublicProps {
	name: RelativeSingleField
	defaultValue?: VariableInput | Scalar
}

export interface FieldMetadata<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> {
	fieldName: FieldName
	data: FieldAccessor<Persisted, Produced>
	errors: ErrorAccessor[]
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
		const children = this.props.children
		if (!children) {
			return null
		}

		return (
			<Field.DataRetriever name={this.props.name}>
				{({ fieldName, data, isMutating, environment }) => {
					if (data instanceof EntityAccessor) {
						const fieldData = data.data.getField(fieldName)

						if (fieldData instanceof FieldAccessor) {
							return (
								<Field.FieldInner<Persisted, Produced>
									fieldName={fieldName}
									data={(fieldData as unknown) as FieldAccessor<Persisted, Produced>}
									isMutating={isMutating}
									errors={fieldData.errors}
									environment={environment}
								>
									{children}
								</Field.FieldInner>
							)
						} else {
							console.error(`Undefined field`, fieldName, data)
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
			props.isNonbearing === true,
		)
	}
}

namespace Field {
	export interface RawMetadata extends Omit<FieldMetadata, 'data' | 'errors'> {
		data: AccessorContextValue
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
				errors: this.props.errors,
				isMutating: this.props.isMutating,
				environment: this.props.environment,
			})
		}
	}

	export interface DataRetrieverProps {
		name: FieldName
		children: (rawMetadata: RawMetadata) => React.ReactNode
	}

	export const DataRetriever = React.memo((props: DataRetrieverProps) => {
		const environment = React.useContext(EnvironmentContext)
		const isMutating = React.useContext(MutationStateContext)

		const propsName = props.name
		const propsChildren = props.children

		return React.useMemo(() => {
			return QueryLanguage.wrapRelativeSingleField(propsName, environment, fieldName => (
				<AccessorContext.Consumer>
					{(data: AccessorContextValue) => (
						<RawMetadataGenerator fieldName={fieldName} data={data} isMutating={isMutating} environment={environment}>
							{propsChildren}
						</RawMetadataGenerator>
					)}
				</AccessorContext.Consumer>
			))
		}, [environment, isMutating, propsName, propsChildren])
	})
	DataRetriever.displayName = 'Field.DataRetriever'

	export interface RawMetadataGeneratorProps extends RawMetadata {
		children: DataRetrieverProps['children']
	}

	export const RawMetadataGenerator = React.memo((props: RawMetadataGeneratorProps) => {
		const rawMetadata = React.useMemo(() => {
			return {
				fieldName: props.fieldName,
				data: props.data,
				isMutating: props.isMutating,
				environment: props.environment,
			}
		}, [props.fieldName, props.data, props.isMutating, props.environment])
		return <>{props.children(rawMetadata)}</>
	})
	RawMetadataGenerator.displayName = 'Field.RawMetadataGenerator'
}

export { Field }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider<FieldProps>>
