import { ErrorList } from '@contember/ui'
import * as React from 'react'
import { AccessorContext, EnvironmentContext, useEntityListAccessor } from '../accessorRetrievers'
import { EntityAccessor, EntityListAccessor } from '../accessors'
import { ExpectedCount, FieldName, Filter, RelativeEntityList } from '../bindingTypes'
import { Environment } from '../dao'
import { EntityFields, ReferenceMarker } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import { Component } from './Component'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { SyntheticChildrenProvider } from './MarkerProvider'

export interface ToManyProps {
	field: RelativeEntityList
	preferences?: ReferenceMarker.ReferencePreferences
	children: React.ReactNode
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
			ToMany.getAtomicPrimitiveFactory(props.children, props.preferences),
			environment,
		)
	}
}

namespace ToMany {
	export const getAtomicPrimitiveFactory = (
		children: React.ReactNode,
		preferences?: ReferenceMarker.ReferencePreferences,
	) => (atomicPrimitiveProps: AtomicPrimitiveProps) => (
		<AtomicPrimitive {...atomicPrimitiveProps} preferences={preferences}>
			{children}
		</AtomicPrimitive>
	)

	export interface AtomicPrimitiveProps {
		field: FieldName
		filter?: Filter
		preferences?: ReferenceMarker.ReferencePreferences
		children?: React.ReactNode
	}

	export const AtomicPrimitive = Component<AtomicPrimitiveProps>(
		props => {
			const accessor = useEntityListAccessor(props.field, props.filter)
			if (!accessor) {
				return null
			}
			return <AccessorRenderer accessor={accessor}>{props.children}</AccessorRenderer>
		},
		{
			generateReferenceMarker(props: AtomicPrimitiveProps, fields: EntityFields): ReferenceMarker {
				return new ReferenceMarker(
					props.field,
					ExpectedCount.PossiblyMany,
					fields,
					props.filter,
					undefined,
					props.preferences,
				)
			},
		},
		'ToMany.AtomicPrimitive',
	)

	export interface AccessorRendererProps {
		accessor: EntityListAccessor
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
		children: (accessor: EntityListAccessor) => React.ReactNode
	}

	export const AccessorRetriever = React.memo((props: AccessorRetrieverProps) => {
		const accessor = useEntityListAccessor(props.field, props.filter)

		if (accessor) {
			return <>{props.children(accessor)}</>
		}
		return null
	})
	AccessorRetriever.displayName = 'ToMany.AccessorRetriever'
}

export { ToMany }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, SyntheticChildrenProvider<ToManyProps>>
