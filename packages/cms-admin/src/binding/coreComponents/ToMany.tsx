import { ErrorList } from '@contember/ui'
import * as React from 'react'
import { FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { EntityAccessor, EntityCollectionAccessor, EntityFields, Environment, ReferenceMarker } from '../dao'
import { Component } from '../facade/auxiliary'
import { QueryLanguage } from '../queryLanguage'
import { AccessorContext, useEntityCollectionAccessor } from './AccessorContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { SyntheticChildrenProvider } from './MarkerProvider'

export interface ToManyProps {
	field: RelativeEntityList
	children?: React.ReactNode
}

class ToMany extends React.PureComponent<ToManyProps> {
	static displayName = 'ToMany'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => ToMany.generateSyntheticChildren(this.props, environment)}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: ToManyProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeEntityList(
			props.field,
			ToMany.getAtomicPrimitiveFactory(props.children),
			environment,
		)
	}
}

namespace ToMany {
	export const getAtomicPrimitiveFactory = (children: React.ReactNode) => (
		atomicPrimitiveProps: AtomicPrimitiveProps,
	) => <ToMany.AtomicPrimitive {...atomicPrimitiveProps}>{children}</ToMany.AtomicPrimitive>

	export interface AtomicPrimitiveProps {
		field: FieldName
		filter?: Filter
	}

	export const AtomicPrimitive = Component<AtomicPrimitiveProps>(
		props => {
			const accessor = useEntityCollectionAccessor(props.field, props.filter)
			if (!accessor) {
				return null
			}
			return <AccessorRenderer accessor={accessor}>{props.children}</AccessorRenderer>
		},
		{
			generateReferenceMarker(props: AtomicPrimitiveProps, fields: EntityFields): ReferenceMarker {
				return new ReferenceMarker(props.field, ReferenceMarker.ExpectedCount.PossiblyMany, fields, props.filter)
			},
		},
		'ToMany.AtomicPrimitive',
	)

	export interface AccessorRendererProps {
		accessor: EntityCollectionAccessor
		children?: React.ReactNode
	}

	export const AccessorRenderer = React.memo((props: AccessorRendererProps) => (
		<>
			<ErrorList errors={props.accessor.errors} />
			{props.accessor.entities.map(
				datum =>
					datum instanceof EntityAccessor && (
						<AccessorContext.Provider value={datum} key={datum.getKey()}>
							{props.children}
						</AccessorContext.Provider>
					),
			)}
		</>
	))
	AccessorRenderer.displayName = 'ToMany.AccessorRenderer'

	// AccessorRetriever is really legacy API to retain support for class components
	export interface AccessorRetrieverProps extends AtomicPrimitiveProps {
		children: (accessor: EntityCollectionAccessor) => React.ReactNode
	}

	export const AccessorRetriever = React.memo((props: AccessorRetrieverProps) => {
		const accessor = useEntityCollectionAccessor(props.field, props.filter)

		if (accessor) {
			return <>{props.children(accessor)}</>
		}
		return null
	})
	AccessorRetriever.displayName = 'ToMany.AccessorRetriever'
}

export { ToMany }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, SyntheticChildrenProvider<ToManyProps>>
