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

	public static generateReferenceMarker(props: ToManyProps, fields: EntityFields): ReferenceMarker {
		return ToMany.CollectionRetriever.generateReferenceMarker(props, fields)
	}
}

namespace ToMany {
	export interface CollectionRetrieverProps extends ToManyProps {
		children: (field: EntityCollectionAccessor) => React.ReactNode
	}

	export interface AccessorRendererProps {
		accessor: EntityCollectionAccessor
	}

	export class CollectionRetriever extends React.PureComponent<CollectionRetrieverProps> {
		public static displayName = 'ToMany'

		public render() {
			return (
				<DataContext.Consumer>
					{(data: DataContextValue) => {
						if (data instanceof EntityAccessor) {
							const field = data.data.getField(
								this.props.field,
								ReferenceMarker.ExpectedCount.PossiblyMany,
								this.props.filter
							)

							if (field instanceof EntityCollectionAccessor) {
								return this.props.children(field)
							}
						}
					}}
				</DataContext.Consumer>
			)
		}

		public static generateReferenceMarker(props: ToManyProps, fields: EntityFields): ReferenceMarker {
			return new ReferenceMarker(props.field, ReferenceMarker.ExpectedCount.PossiblyMany, fields, props.filter)
		}
	}
	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof CollectionRetriever, ReferenceMarkerProvider>

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

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, ReferenceMarkerProvider>
