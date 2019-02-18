import * as React from 'react'
import { FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { EntityAccessor, EntityCollectionAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { Props, ReferenceMarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

export interface ToManyProps {
	field: RelativeEntityList
}

class ToMany extends React.PureComponent<ToManyProps> {
	static displayName = 'ToMany'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => {
					return ToMany.generateSyntheticChildren(this.props, environment)
				}}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: Props<ToManyProps>, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeEntityList(
			props.field,
			ToMany.getAtomicPrimitiveFactory(props.children),
			environment
		)
	}
}

namespace ToMany {
	export const getAtomicPrimitiveFactory = (children: React.ReactNode) => (
		atomicPrimitiveProps: AtomicPrimitiveProps
	) => <ToMany.AtomicPrimitive {...atomicPrimitiveProps}>{children}</ToMany.AtomicPrimitive>

	export interface AtomicPrimitivePublicProps {
		field: FieldName
		filter?: Filter
	}

	export interface AtomicPrimitiveProps extends AtomicPrimitivePublicProps {
		environment: Environment
	}

	export class AtomicPrimitive extends React.PureComponent<AtomicPrimitiveProps> {
		public static displayName = 'ToMany.AtomicPrimitive'

		public render() {
			return (
				<AccessorRetriever field={this.props.field} filter={this.props.filter} environment={this.props.environment}>
					{(accessor: EntityCollectionAccessor) => (
						<AccessorRenderer accessor={accessor}>{this.props.children}</AccessorRenderer>
					)}
				</AccessorRetriever>
			)
		}

		public static generateReferenceMarker(
			props: Props<AtomicPrimitiveProps>,
			fields: EntityFields,
			environment: Environment
		): ReferenceMarker {
			return new ReferenceMarker(
				props.field,
				ReferenceMarker.ExpectedCount.PossiblyMany,
				fields,
				VariableInputTransformer.transformFilter(props.filter, environment)
			)
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof AtomicPrimitive, ReferenceMarkerProvider>

	export interface AccessorRetrieverProps extends AtomicPrimitiveProps {
		children: (accessor: EntityCollectionAccessor) => React.ReactNode
	}

	export class AccessorRetriever extends React.PureComponent<AccessorRetrieverProps> {
		public static displayName = 'ToMany.AccessorRetriever'

		public render() {
			return (
				<DataContext.Consumer>
					{(data: DataContextValue) => {
						if (data instanceof EntityAccessor) {
							const field = data.data.getField(
								this.props.field,
								ReferenceMarker.ExpectedCount.PossiblyMany,
								VariableInputTransformer.transformFilter(this.props.filter, this.props.environment)
							)

							if (field instanceof EntityCollectionAccessor) {
								return this.props.children(field)
							}
						}
					}}
				</DataContext.Consumer>
			)
		}
	}

	export interface AccessorRendererProps {
		accessor: EntityCollectionAccessor
	}

	export class AccessorRenderer extends React.PureComponent<AccessorRendererProps> {
		public render() {
			return this.props.accessor.entities.map(
				(datum) =>
					datum instanceof EntityAccessor && (
						<DataContext.Provider value={datum} key={datum.getKey()}>
							{this.props.children}
						</DataContext.Provider>
					)
			)
		}
	}
}

export { ToMany }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, SyntheticChildrenProvider<ToManyProps>>
