import * as React from 'react'
import { FieldName, Filter } from '../bindingTypes'
import { EntityAccessor, EntityCollectionAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { Parser } from '../queryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { Props, ReferenceMarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

export interface ToManyProps {
	field: FieldName
	filter?: Filter
}

class ToMany extends React.Component<ToManyProps> {
	static displayName = 'ToMany'

	public render() {
		return (
			<ToMany.CollectionRetriever {...this.props}>
				{(field: EntityCollectionAccessor) => {
					return <ToMany.AccessorRenderer accessor={field}>{this.props.children}</ToMany.AccessorRenderer>
				}}
			</ToMany.CollectionRetriever>
		)
	}

	public static generateSyntheticChildren(props: Props<ToManyProps>, environment: Environment): React.ReactNode {
		return Parser.generateWrappedNode(
			props.field,
			fieldName => (
				<ToMany.ReferenceMarkerGenerator {...props} field={fieldName}>
					{props.children}
				</ToMany.ReferenceMarkerGenerator>
			),
			environment
		)
	}
}

namespace ToMany {
	export interface ReferenceMarkerGeneratorProps extends ToManyProps {}

	export interface CollectionRetrieverProps extends ToManyProps {
		children: (field: EntityCollectionAccessor) => React.ReactNode
	}

	export interface AccessorRendererProps {
		accessor: EntityCollectionAccessor
	}

	export class ReferenceMarkerGenerator extends React.PureComponent<ReferenceMarkerGeneratorProps> {
		public static displayName = 'ReferenceMarkerGenerator'
		public static generateReferenceMarker(
			props: ToManyProps,
			fields: EntityFields,
			environment: Environment
		): ReferenceMarker {
			const transformer = new VariableInputTransformer(props.filter, environment)
			return new ReferenceMarker(
				props.field,
				ReferenceMarker.ExpectedCount.PossiblyMany,
				fields,
				transformer.transform()
			)
		}
	}
	type EnforceDataBindingCompatibility1 = EnforceSubtypeRelation<
		typeof ReferenceMarkerGenerator,
		ReferenceMarkerProvider<CollectionRetrieverProps>
	>

	export class CollectionRetriever extends React.PureComponent<CollectionRetrieverProps> {
		public static displayName = 'ToMany'

		public render() {
			return (
				<EnvironmentContext.Consumer>
					{(environment: Environment) =>
						Parser.generateWrappedNode(
							this.props.field,
							fieldName => (
								<DataContext.Consumer>
									{(data: DataContextValue) => {
										if (data instanceof EntityAccessor) {
											const transformer = new VariableInputTransformer(this.props.filter, environment)
											const field = data.data.getField(
												fieldName,
												ReferenceMarker.ExpectedCount.PossiblyMany,
												transformer.transform()
											)

											if (field instanceof EntityCollectionAccessor) {
												return this.props.children(field)
											}
										}
									}}
								</DataContext.Consumer>
							),
							environment
						)
					}
				</EnvironmentContext.Consumer>
			)
		}

		public static generateSyntheticChildren(props: Props<CollectionRetrieverProps>): React.ReactNode {
			return (
				<ReferenceMarkerGenerator field={props.field} filter={props.filter}>
					{props.children}
				</ReferenceMarkerGenerator>
			)
		}
	}
	type EnforceDataBindingCompatibility2 = EnforceSubtypeRelation<
		typeof CollectionRetriever,
		SyntheticChildrenProvider<CollectionRetrieverProps>
	>

	export class AccessorRenderer extends React.PureComponent<AccessorRendererProps> {
		public render() {
			return this.props.accessor.entities.map(
				(datum, i) =>
					datum instanceof EntityAccessor && (
						<DataContext.Provider value={datum} key={i}>
							{this.props.children}
						</DataContext.Provider>
					)
			)
		}
	}
}

export { ToMany }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, SyntheticChildrenProvider<ToManyProps>>
